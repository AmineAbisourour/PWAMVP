import { useState, useEffect } from 'react';
import { updateHOA, getHOAById, clearAllTransactions, clearAllData, getFinancialSummary } from '../db/database';
import { getCurrencySymbol } from '../utils/currency';
import { getCurrencyForCountry, getCountriesSorted } from '../utils/countries';

export function HOASettings({ hoa, onUpdate }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    numberOfUnits: '',
    monthlyContribution: '',
    country: 'MA',
    openingBalance: '',
  });

  const countries = getCountriesSorted();
  const currentCountryCurrency = getCurrencyForCountry(formData.country);

  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showDeleteTransactionsConfirm, setShowDeleteTransactionsConfirm] = useState(false);
  const [showResetAppConfirm, setShowResetAppConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [financialSummary, setFinancialSummary] = useState(null);
  const [isDangerZoneExpanded, setIsDangerZoneExpanded] = useState(false);

  // Load HOA data into form
  useEffect(() => {
    if (hoa) {
      setFormData({
        name: hoa.name || '',
        address: hoa.address || '',
        numberOfUnits: hoa.numberOfUnits || '',
        monthlyContribution: hoa.monthlyContribution || '',
        country: hoa.country || 'MA',
        openingBalance: hoa.openingBalance || '',
      });
    }
  }, [hoa]);

  // Load financial summary
  useEffect(() => {
    if (hoa) {
      loadFinancialSummary();
    }
  }, [hoa]);

  const loadFinancialSummary = async () => {
    try {
      const summary = await getFinancialSummary(hoa.id);
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error loading financial summary:', error);
    }
  };

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
          country: formData.country,
          openingBalance: parseFloat(formData.openingBalance) || 0,
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

  const handleDeleteAllTransactions = async () => {
    try {
      setDeleting(true);
      await clearAllTransactions(hoa.id);
      await loadFinancialSummary();
      setShowDeleteTransactionsConfirm(false);
      alert('All transactions have been deleted successfully.');
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert('Failed to delete transactions. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleResetApp = async () => {
    try {
      setDeleting(true);
      await clearAllData();
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Error resetting app:', error);
      alert('Failed to reset app. Please try again.');
      setDeleting(false);
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

          {/* Country Selector */}
          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
              Country *
            </label>
            <select
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors bg-white"
            >
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Currency and number formatting will be updated based on your country
            </p>
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
              <span className="absolute left-4 top-3 text-gray-500 font-medium">
                {getCurrencySymbol(currentCountryCurrency)}
              </span>
              <input
                type="number"
                id="monthlyContribution"
                name="monthlyContribution"
                value={formData.monthlyContribution}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full pl-16 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
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
              <span className="absolute left-4 top-3 text-gray-500 font-medium">
                {getCurrencySymbol(currentCountryCurrency)}
              </span>
              <input
                type="number"
                id="openingBalance"
                name="openingBalance"
                value={formData.openingBalance}
                onChange={handleChange}
                step="0.01"
                className="w-full pl-16 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                placeholder="0.00"
              />
            </div>
            <p className="text-xs text-gray-600">
              <span className="font-semibold">Initial balance from previous management.</span><br />
              Enter positive amount for surplus, negative for deficit.
            </p>
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

      {/* Danger Zone */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg border-2 border-red-200 overflow-hidden">
        {/* Collapsible Header */}
        <button
          onClick={() => setIsDangerZoneExpanded(!isDangerZoneExpanded)}
          className="w-full p-6 md:p-8 flex items-center justify-between hover:bg-red-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-red-900">Danger Zone</h2>
              <p className="text-sm text-red-700 mt-1">
                Destructive actions that cannot be undone
              </p>
            </div>
          </div>
          <svg
            className={`w-6 h-6 text-red-600 flex-shrink-0 transition-transform duration-300 ${
              isDangerZoneExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            isDangerZoneExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
          } overflow-hidden`}
        >
          <div className="px-6 md:px-8 pb-6 md:pb-8 space-y-6">

            {/* Delete All Transactions */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">Delete All Transactions</h3>
              <p className="text-sm text-red-700 mb-2">
                Permanently delete all contributions and expenses. HOA settings will be preserved.
              </p>
              {financialSummary && (
                <p className="text-xs text-red-600 font-semibold">
                  {financialSummary.contributionCount} contributions + {financialSummary.expenseCount} expenses = {financialSummary.contributionCount + financialSummary.expenseCount} total transactions
                </p>
              )}
            </div>
            <button
              onClick={() => setShowDeleteTransactionsConfirm(true)}
              disabled={!financialSummary || (financialSummary.contributionCount + financialSummary.expenseCount) === 0}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              Delete All Transactions
            </button>
          </div>
            </div>

            {/* Reset Entire App */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-1">Reset Entire App</h3>
              <p className="text-sm text-red-700">
                Permanently delete ALL data including HOA settings, contributions, and expenses. This will reset the app to its initial state.
              </p>
            </div>
            <button
              onClick={() => setShowResetAppConfirm(true)}
              className="px-6 py-3 bg-red-700 text-white rounded-xl font-semibold hover:bg-red-800 active:bg-red-900 transition-colors shadow-lg hover:shadow-xl flex-shrink-0"
            >
              Reset App
            </button>
          </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Transactions Confirmation Modal */}
      {showDeleteTransactionsConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete All Transactions?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently delete all {financialSummary?.contributionCount + financialSummary?.expenseCount} transactions. This action cannot be undone.
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-900 font-semibold">What will be deleted:</p>
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    <li>• {financialSummary?.contributionCount} contribution records</li>
                    <li>• {financialSummary?.expenseCount} expense records</li>
                  </ul>
                  <p className="text-xs text-red-900 font-semibold mt-2">What will be kept:</p>
                  <ul className="text-xs text-red-700 mt-1">
                    <li>• HOA settings and information</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteTransactionsConfirm(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllTransactions}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset App Confirmation Modal */}
      {showResetAppConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900">Reset Entire App?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently delete ALL data and reset the app to its initial state. This action cannot be undone.
                </p>
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-xs text-red-900 font-semibold">Everything will be deleted:</p>
                  <ul className="text-xs text-red-700 mt-1 space-y-1">
                    <li>• HOA settings and information</li>
                    <li>• All contribution records</li>
                    <li>• All expense records</li>
                    <li>• All financial data</li>
                  </ul>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Type <span className="text-red-600 font-mono">DELETE</span> to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-4 py-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetAppConfirm(false);
                  setDeleteConfirmText('');
                }}
                disabled={deleting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleResetApp}
                disabled={deleting || deleteConfirmText !== 'DELETE'}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Resetting...' : 'Reset App'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
