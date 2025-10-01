import { useState, useEffect } from 'react';
import { updateHOA, getHOAById } from '../db/database';

export function HOASettings({ hoa, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    numberOfUnits: '',
    monthlyContribution: '',
  });

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load HOA data into form
  useEffect(() => {
    if (hoa) {
      setFormData({
        name: hoa.name || '',
        address: hoa.address || '',
        numberOfUnits: hoa.numberOfUnits || '',
        monthlyContribution: hoa.monthlyContribution || '',
      });
    }
  }, [hoa]);

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
    // Clear success message when editing
    if (saveSuccess) {
      setSaveSuccess(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        setSaving(true);
        await updateHOA(hoa.id, {
          name: formData.name.trim(),
          address: formData.address.trim(),
          numberOfUnits: parseInt(formData.numberOfUnits, 10),
          monthlyContribution: parseFloat(formData.monthlyContribution),
        });

        // Refresh HOA data
        const updatedHOA = await getHOAById(hoa.id);
        if (onUpdate) {
          onUpdate(updatedHOA);
        }

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (error) {
        console.error('Error updating HOA:', error);
        alert('Failed to update HOA settings. Please try again.');
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            HOA Settings
          </h1>
          <p className="text-gray-600">
            Update your Homeowners Association details
          </p>
        </div>

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

          {/* Save Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`w-full px-6 py-3 rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl ${
                saving
                  ? 'bg-gray-400 cursor-not-allowed'
                  : saveSuccess
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
              } text-white`}
            >
              {saving ? 'Saving...' : saveSuccess ? '✓ Saved Successfully' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* HOA Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">HOA Information</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Created:</span>
              <span className="font-medium text-gray-900">
                {hoa?.createdAt ? new Date(hoa.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }) : 'N/A'}
              </span>
            </div>
            {hoa?.updatedAt && (
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium text-gray-900">
                  {new Date(hoa.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span>HOA ID:</span>
              <span className="font-mono text-xs text-gray-900">{hoa?.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
