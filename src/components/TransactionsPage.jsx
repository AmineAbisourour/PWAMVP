import { useState, useEffect } from 'react';
import { getAllTransactions, deleteContribution, deleteExpense, clearAllTransactions } from '../db/database';
import { TransactionDetailModal } from './TransactionDetailModal';

export function TransactionsPage({ hoa, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await getAllTransactions(hoa.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [hoa.id]);

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

  const getStatusBadge = (status) => {
    if (status === 'paid') {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
        Pending
      </span>
    );
  };

  const toggleSelection = (transactionId) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(transactions.map(t => `${t.transactionType}-${t.id}`)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleDeleteSelected = async () => {
    try {
      setDeleting(true);

      // Group transactions by type
      const toDelete = transactions.filter(t =>
        selectedIds.has(`${t.transactionType}-${t.id}`)
      );

      // Delete all selected transactions
      await Promise.all(
        toDelete.map(t =>
          t.transactionType === 'contribution'
            ? deleteContribution(t.id)
            : deleteExpense(t.id)
        )
      );

      // Reload transactions
      await loadTransactions();
      setSelectionMode(false);
      setSelectedIds(new Set());
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting transactions:', error);
      alert('Failed to delete transactions. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeleting(true);
      await clearAllTransactions(hoa.id);
      await loadTransactions();
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error('Error deleting all transactions:', error);
      alert('Failed to delete all transactions. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Action Toolbar */}
      {!loading && transactions.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {!selectionMode ? (
            <>
              <button
                onClick={() => setSelectionMode(true)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Select
              </button>
              <button
                onClick={() => setShowDeleteAllConfirm(true)}
                className="px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg font-semibold hover:bg-red-100 transition-colors"
              >
                Delete All
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectionMode(false);
                    setSelectedIds(new Set());
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <span className="text-sm text-gray-600">
                  {selectedIds.size} selected
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectedIds.size === transactions.length ? deselectAll : selectAll}
                  className="px-4 py-2 text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {selectedIds.size === transactions.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedIds.size === 0}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Selected
                </button>
              </div>
            </>
          )}
        </div>
      )}

        {loading ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600 text-lg">No transactions yet</p>
            <p className="text-gray-500 text-sm mt-2">Start by adding contributions or expenses</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => {
              const transactionKey = `${transaction.transactionType}-${transaction.id}`;
              const isSelected = selectedIds.has(transactionKey);

              return (
              <div
                key={transactionKey}
                className={`bg-white rounded-xl shadow-md p-4 transition-all ${
                  selectionMode ? 'cursor-pointer' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => {
                  if (selectionMode) {
                    toggleSelection(transactionKey);
                  } else {
                    setSelectedTransaction(transaction);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Checkbox in selection mode */}
                  {selectionMode && (
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(transactionKey)}
                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        transaction.transactionType === 'contribution' ? 'bg-green-600' : 'bg-red-600'
                      }`}></span>
                      <span className="font-semibold text-gray-900">
                        {transaction.transactionType === 'contribution'
                          ? `Unit ${transaction.unitNumber}`
                          : transaction.type}
                      </span>
                      {getStatusBadge(transaction.paymentStatus)}
                      {transaction.transactionType === 'contribution' && transaction.receiptDelivered && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          Receipt ✓
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-600">
                      {transaction.transactionType === 'contribution'
                        ? formatMonthRange(transaction.startMonth, transaction.endMonth)
                        : transaction.description || 'No description'}
                    </div>

                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className={`text-xl font-bold ${
                      transaction.transactionType === 'contribution' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${transaction.amount.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}

      {/* Delete Selected Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete {selectedIds.size} Transaction{selectedIds.size > 1 ? 's' : ''}?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently delete the selected transactions. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation */}
      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete All Transactions?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will permanently delete all {transactions.length} transactions (contributions and expenses). This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                disabled={deleting}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAll}
                disabled={deleting}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={loadTransactions}
        />
      )}
    </div>
  );
}
