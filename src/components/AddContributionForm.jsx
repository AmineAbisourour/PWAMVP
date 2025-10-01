import { useState, useEffect } from 'react';

export function AddContributionForm({ hoa, onCancel, onCreate }) {
  const [formData, setFormData] = useState({
    unitNumber: '',
    startMonth: '',
    endMonth: '',
    amount: hoa.monthlyContribution.toString(),
  });
  const [isMultiMonth, setIsMultiMonth] = useState(false);
  const [errors, setErrors] = useState({});

  // Calculate amount based on months selected
  useEffect(() => {
    if (isMultiMonth && formData.startMonth && formData.endMonth) {
      const start = new Date(formData.startMonth);
      const end = new Date(formData.endMonth);

      if (end >= start) {
        // Calculate number of months
        const months = (end.getFullYear() - start.getFullYear()) * 12 +
                       (end.getMonth() - start.getMonth()) + 1;
        setFormData(prev => ({
          ...prev,
          amount: (hoa.monthlyContribution * months).toFixed(2),
        }));
      }
    } else if (!isMultiMonth && formData.startMonth) {
      // Single month - use monthly contribution
      setFormData(prev => ({
        ...prev,
        amount: hoa.monthlyContribution.toFixed(2),
        endMonth: '',
      }));
    }
  }, [isMultiMonth, formData.startMonth, formData.endMonth, hoa.monthlyContribution]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const toggleMultiMonth = () => {
    setIsMultiMonth(!isMultiMonth);
    if (isMultiMonth) {
      // Clearing multi-month, reset end month
      setFormData(prev => ({ ...prev, endMonth: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.unitNumber) {
      newErrors.unitNumber = 'Please select a unit number';
    }

    if (!formData.startMonth) {
      newErrors.startMonth = 'Please select a start month';
    }

    if (isMultiMonth && !formData.endMonth) {
      newErrors.endMonth = 'Please select an end month';
    }

    if (isMultiMonth && formData.startMonth && formData.endMonth) {
      const start = new Date(formData.startMonth);
      const end = new Date(formData.endMonth);
      if (end < start) {
        newErrors.endMonth = 'End month must be after start month';
      }
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onCreate({
        unitNumber: parseInt(formData.unitNumber, 10),
        startMonth: formData.startMonth,
        endMonth: isMultiMonth ? formData.endMonth : null,
        amount: parseFloat(formData.amount),
      });
    }
  };

  // Generate unit numbers array
  const unitNumbers = Array.from({ length: hoa.numberOfUnits }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 safe-area-inset">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-gray-900">Add Contribution</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Unit Number */}
          <div>
            <label htmlFor="unitNumber" className="block text-sm font-semibold text-gray-700 mb-2">
              Unit Number *
            </label>
            <select
              id="unitNumber"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                errors.unitNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select unit number</option>
              {unitNumbers.map((num) => (
                <option key={num} value={num}>
                  Unit {num}
                </option>
              ))}
            </select>
            {errors.unitNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.unitNumber}</p>
            )}
          </div>

          {/* Start Month */}
          <div>
            <label htmlFor="startMonth" className="block text-sm font-semibold text-gray-700 mb-2">
              {isMultiMonth ? 'Start Month *' : 'Month *'}
            </label>
            <input
              type="month"
              id="startMonth"
              name="startMonth"
              value={formData.startMonth}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                errors.startMonth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.startMonth && (
              <p className="mt-1 text-sm text-red-600">{errors.startMonth}</p>
            )}
          </div>

          {/* Multi-month toggle */}
          <div>
            <button
              type="button"
              onClick={toggleMultiMonth}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                isMultiMonth ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
              }`}>
                {isMultiMonth && (
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              Multiple months
            </button>
          </div>

          {/* End Month (conditional) */}
          {isMultiMonth && (
            <div>
              <label htmlFor="endMonth" className="block text-sm font-semibold text-gray-700 mb-2">
                End Month *
              </label>
              <input
                type="month"
                id="endMonth"
                name="endMonth"
                value={formData.endMonth}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.endMonth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.endMonth && (
                <p className="mt-1 text-sm text-red-600">{errors.endMonth}</p>
              )}
            </div>
          )}

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-semibold text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">$</span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.amount ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
