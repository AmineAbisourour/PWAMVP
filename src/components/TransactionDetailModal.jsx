import { useState } from 'react';
import { updateContribution, updateExpense, deleteContribution, deleteExpense } from '../db/database';

export function TransactionDetailModal({ transaction, onClose, onUpdate }) {
  const [paymentStatus, setPaymentStatus] = useState(transaction.paymentStatus || 'pending');
  const [receiptDelivered, setReceiptDelivered] = useState(transaction.receiptDelivered || false);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isContribution = transaction.transactionType === 'contribution';

  const formatMonthRange = (startMonth, endMonth) => {
    const start = new Date(startMonth + '-01');
    const startFormatted = start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (endMonth) {
      const end = new Date(endMonth + '-01');
      const endFormatted = end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      return `${startFormatted} - ${endFormatted}`;
    }

    return startFormatted;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isContribution) {
        await updateContribution(transaction.id, {
          paymentStatus,
          receiptDelivered,
        });
      } else {
        await updateExpense(transaction.id, {
          paymentStatus,
        });
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      alert('Failed to update transaction. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);

      if (isContribution) {
        await deleteContribution(transaction.id);
      } else {
        await deleteExpense(transaction.id);
      }

      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      alert('Failed to delete transaction. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 safe-area-inset">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              {isContribution ? 'Contribution Details' : 'Expense Details'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount</span>
              <span className={`text-2xl font-bold ${isContribution ? 'text-green-600' : 'text-red-600'}`}>
                ${transaction.amount.toFixed(2)}
              </span>
            </div>

            {isContribution ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unit Number</span>
                  <span className="font-semibold text-gray-900">Unit {transaction.unitNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Period</span>
                  <span className="font-semibold text-gray-900">
                    {formatMonthRange(transaction.startMonth, transaction.endMonth)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Type</span>
                  <span className="font-semibold text-gray-900">{transaction.type}</span>
                </div>
                {transaction.description && (
                  <div className="pt-2">
                    <span className="text-sm text-gray-600">Description</span>
                    <p className="text-gray-900 mt-1">{transaction.description}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm text-gray-600">Date</span>
              <span className="text-sm text-gray-900">
                {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Payment Status
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentStatus('paid')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  paymentStatus === 'paid'
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Paid
              </button>
              <button
                onClick={() => setPaymentStatus('pending')}
                className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                  paymentStatus === 'pending'
                    ? 'bg-yellow-500 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pending
              </button>
            </div>
          </div>

          {/* Receipt Delivery (for contributions only) */}
          {isContribution && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Receipt Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setReceiptDelivered(true)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    receiptDelivered
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Delivered
                </button>
                <button
                  onClick={() => setReceiptDelivered(false)}
                  className={`px-4 py-3 rounded-xl font-semibold transition-all ${
                    !receiptDelivered
                      ? 'bg-gray-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Not Delivered
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Delete Button */}
          <div className="pt-4 border-t border-gray-200 mt-4">
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full px-6 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 active:bg-red-200 transition-colors border border-red-200"
              >
                Delete Transaction
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-900">Are you sure?</p>
                    <p className="text-xs text-red-700 mt-1">
                      This will permanently delete this transaction. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
