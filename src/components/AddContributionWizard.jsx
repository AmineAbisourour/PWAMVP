import { useState, useEffect } from 'react';
import { getCurrencySymbol } from '../utils/currency';
import { getCurrencyForCountry } from '../utils/countries';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function AddContributionWizard({ hoa, onCancel, onCreate }) {
  const currency = getCurrencyForCountry(hoa.country);
  const currentDate = new Date();

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [firstClickMonth, setFirstClickMonth] = useState(null);
  const [amount, setAmount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [receiptDelivered, setReceiptDelivered] = useState(false);

  // Calculate amount based on selected months
  useEffect(() => {
    if (selectedMonths.length > 0) {
      setAmount(hoa.monthlyContribution * selectedMonths.length);
    } else {
      setAmount(0);
    }
  }, [selectedMonths, hoa.monthlyContribution]);

  // Generate unit numbers
  const unitNumbers = Array.from({ length: hoa.numberOfUnits }, (_, i) => i + 1);

  // Handle unit selection
  const handleUnitSelect = (unitNumber) => {
    setSelectedUnit(unitNumber);
    setStep(2);
  };

  // Handle month click with smart selection logic
  const handleMonthClick = (monthIndex) => {
    if (firstClickMonth === null) {
      // First click: Select single month
      setFirstClickMonth(monthIndex);
      setSelectedMonths([monthIndex]);
    } else if (firstClickMonth === monthIndex) {
      // Clicking same month: Clear selection
      setFirstClickMonth(null);
      setSelectedMonths([]);
    } else if (selectedMonths.length === 1 && selectedMonths[0] === firstClickMonth) {
      // Second click on different month: Create range
      const start = Math.min(firstClickMonth, monthIndex);
      const end = Math.max(firstClickMonth, monthIndex);
      const range = [];
      for (let i = start; i <= end; i++) {
        range.push(i);
      }
      setSelectedMonths(range);
    } else {
      // Third click (range already selected): Clear and start fresh
      setFirstClickMonth(monthIndex);
      setSelectedMonths([monthIndex]);
    }
  };

  // Handle year navigation
  const handlePreviousYear = () => {
    setSelectedYear(selectedYear - 1);
    setFirstClickMonth(null);
    setSelectedMonths([]);
  };

  const handleNextYear = () => {
    setSelectedYear(selectedYear + 1);
    setFirstClickMonth(null);
    setSelectedMonths([]);
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedMonths.length === 0) return;

    // Format months as YYYY-MM
    const sortedMonths = [...selectedMonths].sort((a, b) => a - b);
    const startMonth = `${selectedYear}-${String(sortedMonths[0] + 1).padStart(2, '0')}`;
    const endMonth = sortedMonths.length > 1
      ? `${selectedYear}-${String(sortedMonths[sortedMonths.length - 1] + 1).padStart(2, '0')}`
      : null;

    onCreate({
      unitNumber: selectedUnit,
      startMonth,
      endMonth,
      amount,
      paymentStatus,
      receiptDelivered,
    });
  };

  // Check if month is selected
  const isMonthSelected = (monthIndex) => selectedMonths.includes(monthIndex);

  // Check if month is first click
  const isFirstClick = (monthIndex) => firstClickMonth === monthIndex && selectedMonths.length === 1;

  // Format selected months for display
  const formatSelectedMonths = () => {
    if (selectedMonths.length === 0) return 'None';
    if (selectedMonths.length === 1) return MONTHS[selectedMonths[0]];
    const sorted = [...selectedMonths].sort((a, b) => a - b);
    return `${MONTHS[sorted[0]]} - ${MONTHS[sorted[sorted.length - 1]]}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 safe-area-inset">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl z-10">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold text-gray-900">Add Contribution</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="text-sm text-gray-600">Step {step} of 3</div>
          {/* Progress bar */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step 1: Unit Selection */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Unit</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {unitNumbers.map((num) => (
                <button
                  key={num}
                  onClick={() => handleUnitSelect(num)}
                  className="bg-gradient-to-br from-green-50 to-green-100 hover:from-green-100 hover:to-green-200 active:from-green-200 active:to-green-300 border-2 border-green-300 rounded-xl p-6 font-bold text-lg text-gray-900 transition-all shadow-md hover:shadow-lg flex flex-col items-center justify-center min-h-[100px]"
                >
                  <div className="text-3xl mb-1">{num}</div>
                  <div className="text-xs text-gray-600">Unit</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Month Selection */}
        {step === 2 && (
          <div className="p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Month(s) for Unit {selectedUnit}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Click once for single month, click another month to select a range, click again to reset
              </p>
            </div>

            {/* Year selector */}
            <div className="flex items-center justify-center gap-4 mb-6 bg-gray-50 rounded-xl p-4">
              <button
                onClick={handlePreviousYear}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="text-2xl font-bold text-gray-900 min-w-[100px] text-center">
                {selectedYear}
              </div>
              <button
                onClick={handleNextYear}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
              {MONTHS.map((month, index) => (
                <button
                  key={index}
                  onClick={() => handleMonthClick(index)}
                  className={`p-4 rounded-xl font-semibold text-sm transition-all ${
                    isMonthSelected(index)
                      ? isFirstClick(index)
                        ? 'bg-blue-600 text-white shadow-lg ring-2 ring-blue-400'
                        : 'bg-green-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {month}
                </button>
              ))}
            </div>

            {/* Amount display */}
            {selectedMonths.length > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 mb-6 border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-700 font-medium">
                      {selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''} selected
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {formatSelectedMonths()} {selectedYear}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {getCurrencySymbol(currency)}{amount.toFixed(2)}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={selectedMonths.length === 0}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review & Confirm */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Review & Confirm</h3>

            {/* Summary card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 mb-6 border border-green-200">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Unit Number</span>
                  <span className="text-xl font-bold text-gray-900">Unit {selectedUnit}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Period</span>
                  <span className="text-gray-900 font-semibold">
                    {formatSelectedMonths()} {selectedYear}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 font-medium">Months</span>
                  <span className="text-gray-900 font-semibold">
                    {selectedMonths.length} month{selectedMonths.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="pt-4 border-t border-green-300 flex justify-between items-center">
                  <span className="text-gray-800 font-bold text-lg">Total Amount</span>
                  <span className="text-3xl font-bold text-green-800">
                    {getCurrencySymbol(currency)}{amount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Optional settings */}
            <div className="space-y-4 mb-6">
              {/* Payment status */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700 font-medium">Mark as Paid</span>
                  <button
                    type="button"
                    onClick={() => setPaymentStatus(paymentStatus === 'paid' ? 'pending' : 'paid')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      paymentStatus === 'paid' ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        paymentStatus === 'paid' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>

              {/* Receipt delivered */}
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-gray-700 font-medium">Receipt Delivered</span>
                  <button
                    type="button"
                    onClick={() => setReceiptDelivered(!receiptDelivered)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      receiptDelivered ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        receiptDelivered ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg hover:shadow-xl"
              >
                Create Contribution
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
