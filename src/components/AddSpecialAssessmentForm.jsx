import { useState } from 'react';

export function AddSpecialAssessmentForm({ hoa, onCancel, onCreate }) {
  const [formData, setFormData] = useState({
    purpose: '',
    amountPerUnit: '',
    dueDate: new Date().toISOString().slice(0, 7), // Current month
    notes: '',
    targetType: 'all', // 'all' or 'specific'
    specificUnits: [],
  });

  const [errors, setErrors] = useState({});

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

  const handleTargetTypeChange = (type) => {
    setFormData((prev) => ({
      ...prev,
      targetType: type,
      specificUnits: type === 'all' ? [] : prev.specificUnits,
    }));
  };

  const handleUnitToggle = (unitNumber) => {
    setFormData((prev) => {
      const units = prev.specificUnits.includes(unitNumber)
        ? prev.specificUnits.filter(u => u !== unitNumber)
        : [...prev.specificUnits, unitNumber].sort((a, b) => a - b);
      return { ...prev, specificUnits: units };
    });
  };

  const selectAllUnits = () => {
    const allUnits = Array.from({ length: hoa.numberOfUnits }, (_, i) => i + 1);
    setFormData((prev) => ({ ...prev, specificUnits: allUnits }));
  };

  const deselectAllUnits = () => {
    setFormData((prev) => ({ ...prev, specificUnits: [] }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
    }

    if (!formData.amountPerUnit || parseFloat(formData.amountPerUnit) <= 0) {
      newErrors.amountPerUnit = 'Please enter a valid amount';
    }

    if (formData.targetType === 'specific' && formData.specificUnits.length === 0) {
      newErrors.specificUnits = 'Please select at least one unit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      const assessmentData = {
        hoaId: hoa.id,
        purpose: formData.purpose.trim(),
        amountPerUnit: parseFloat(formData.amountPerUnit),
        dueDate: formData.dueDate,
        notes: formData.notes.trim() || null,
        unitNumbers: formData.targetType === 'all'
          ? Array.from({ length: hoa.numberOfUnits }, (_, i) => i + 1)
          : formData.specificUnits,
      };
      onCreate(assessmentData);
    }
  };

  const totalAmount = formData.targetType === 'all'
    ? (parseFloat(formData.amountPerUnit) || 0) * hoa.numberOfUnits
    : (parseFloat(formData.amountPerUnit) || 0) * formData.specificUnits.length;

  const unitCount = formData.targetType === 'all' ? hoa.numberOfUnits : formData.specificUnits.length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create Special Assessment</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-semibold text-gray-700 mb-2">
              Purpose / Description *
            </label>
            <input
              type="text"
              id="purpose"
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                errors.purpose ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., Facade Repainting, Emergency Roof Repair"
            />
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          {/* Amount per Unit */}
          <div>
            <label htmlFor="amountPerUnit" className="block text-sm font-semibold text-gray-700 mb-2">
              Amount per Unit *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-500">$</span>
              <input
                type="number"
                id="amountPerUnit"
                name="amountPerUnit"
                value={formData.amountPerUnit}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.amountPerUnit ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
            </div>
            {errors.amountPerUnit && (
              <p className="mt-1 text-sm text-red-600">{errors.amountPerUnit}</p>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
              Due Date (Optional)
            </label>
            <input
              type="month"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
            />
          </div>

          {/* Target Units */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Apply To *
            </label>
            <div className="space-y-3">
              {/* All Units Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.targetType === 'all' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  checked={formData.targetType === 'all'}
                  onChange={() => handleTargetTypeChange('all')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">All Units</span>
                  <p className="text-sm text-gray-600">Apply to all {hoa.numberOfUnits} units</p>
                </div>
              </label>

              {/* Specific Units Option */}
              <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                formData.targetType === 'specific' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-300'
              }`}>
                <input
                  type="radio"
                  name="targetType"
                  checked={formData.targetType === 'specific'}
                  onChange={() => handleTargetTypeChange('specific')}
                  className="w-5 h-5 text-blue-600"
                />
                <div className="flex-1">
                  <span className="font-semibold text-gray-900">Specific Units</span>
                  <p className="text-sm text-gray-600">Select which units to apply this assessment to</p>
                </div>
              </label>
            </div>

            {/* Unit Selection Grid */}
            {formData.targetType === 'specific' && (
              <div className="mt-4 p-4 border border-gray-300 rounded-xl bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-gray-700">
                    Select Units ({formData.specificUnits.length} selected)
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllUnits}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllUnits}
                      className="text-xs px-3 py-1 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-48 overflow-y-auto">
                  {Array.from({ length: hoa.numberOfUnits }, (_, i) => i + 1).map(unitNumber => (
                    <button
                      key={unitNumber}
                      type="button"
                      onClick={() => handleUnitToggle(unitNumber)}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        formData.specificUnits.includes(unitNumber)
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-300'
                      }`}
                    >
                      {unitNumber}
                    </button>
                  ))}
                </div>
                {errors.specificUnits && (
                  <p className="mt-2 text-sm text-red-600">{errors.specificUnits}</p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors resize-none"
              placeholder="Any additional information about this assessment..."
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 className="font-semibold text-gray-900 mb-2">Assessment Summary</h3>
            <div className="space-y-1 text-sm text-gray-700">
              <p><span className="font-semibold">Units:</span> {unitCount}</p>
              <p><span className="font-semibold">Amount per unit:</span> ${parseFloat(formData.amountPerUnit || 0).toFixed(2)}</p>
              <p className="text-lg font-bold text-blue-600 mt-2">
                Total: ${totalAmount.toFixed(2)}
              </p>
            </div>
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
              Create Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
