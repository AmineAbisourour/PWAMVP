import { useState } from 'react';

export function CreateHOAForm({ onCancel, onCreate }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    numberOfUnits: '',
    monthlyContribution: '',
    openingBalance: '0',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'HOA name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.numberOfUnits || formData.numberOfUnits <= 0) {
      newErrors.numberOfUnits = 'Please enter a valid number of units';
    }

    if (!formData.monthlyContribution || formData.monthlyContribution <= 0) {
      newErrors.monthlyContribution = 'Please enter a valid contribution amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (validateForm()) {
      onCreate({
        name: formData.name.trim(),
        address: formData.address.trim(),
        numberOfUnits: parseInt(formData.numberOfUnits, 10),
        monthlyContribution: parseFloat(formData.monthlyContribution),
        openingBalance: parseFloat(formData.openingBalance) || 0,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 safe-area-inset">
      {/* Header */}
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onCancel}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Your HOA
          </h1>
          <p className="text-gray-600 mb-8">
            Enter the details of your Homeowners Association
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* HOA Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                HOA Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Sunset Valley HOA"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                Address *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.address ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 123 Main Street, City, State"
              />
              {errors.address && (
                <p className="mt-1 text-sm text-red-600">{errors.address}</p>
              )}
            </div>

            {/* Number of Units */}
            <div>
              <label htmlFor="numberOfUnits" className="block text-sm font-semibold text-gray-700 mb-2">
                Number of Units *
              </label>
              <input
                type="number"
                id="numberOfUnits"
                name="numberOfUnits"
                value={formData.numberOfUnits}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                  errors.numberOfUnits ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 50"
              />
              {errors.numberOfUnits && (
                <p className="mt-1 text-sm text-red-600">{errors.numberOfUnits}</p>
              )}
            </div>

            {/* Monthly Contribution */}
            <div>
              <label htmlFor="monthlyContribution" className="block text-sm font-semibold text-gray-700 mb-2">
                Monthly Contribution Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  id="monthlyContribution"
                  name="monthlyContribution"
                  value={formData.monthlyContribution}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className={`w-full pl-8 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    errors.monthlyContribution ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.monthlyContribution && (
                <p className="mt-1 text-sm text-red-600">{errors.monthlyContribution}</p>
              )}
            </div>

            {/* Opening Balance */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <label htmlFor="openingBalance" className="block text-sm font-semibold text-gray-700 mb-2">
                Opening Balance (Optional)
              </label>
              <div className="relative mb-2">
                <span className="absolute left-4 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  id="openingBalance"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleChange}
                  step="0.01"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-600">
                <span className="font-semibold">Taking over from previous management?</span><br />
                Enter positive amount for surplus, negative for deficit.
                Leave at $0 if starting fresh.
              </p>
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
                Create HOA
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
