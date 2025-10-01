import { useState, useEffect, useMemo } from 'react';
import { getAllTransactions, deleteContribution, deleteExpense, clearAllTransactions, bulkUpdatePaymentStatus, bulkUpdateReceiptStatus } from '../db/database';
import { TransactionDetailModal } from './TransactionDetailModal';

export function TransactionsPage({ hoa, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMarkPaidConfirm, setShowMarkPaidConfirm] = useState(false);
  const [showMarkReceiptConfirm, setShowMarkReceiptConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Filter states with localStorage persistence
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState(() => {
    return localStorage.getItem('hoa-filter-type') || 'all';
  }); // 'all', 'contributions', 'expenses'
  const [filterPaymentStatus, setFilterPaymentStatus] = useState(() => {
    return localStorage.getItem('hoa-filter-payment') || 'all';
  }); // 'all', 'paid', 'pending'
  const [filterReceiptStatus, setFilterReceiptStatus] = useState(() => {
    return localStorage.getItem('hoa-filter-receipt') || 'all';
  }); // 'all', 'delivered', 'pending'

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

  // Save filters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('hoa-filter-type', filterType);
  }, [filterType]);

  useEffect(() => {
    localStorage.setItem('hoa-filter-payment', filterPaymentStatus);
  }, [filterPaymentStatus]);

  useEffect(() => {
    localStorage.setItem('hoa-filter-receipt', filterReceiptStatus);
  }, [filterReceiptStatus]);

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Filter by transaction type
      if (filterType !== 'all') {
        if (filterType === 'contributions' && t.transactionType !== 'contribution') return false;
        if (filterType === 'expenses' && t.transactionType !== 'expense') return false;
      }

      // Filter by payment status
      if (filterPaymentStatus !== 'all') {
        if (t.paymentStatus !== filterPaymentStatus) return false;
      }

      // Filter by receipt status (only for contributions)
      if (filterReceiptStatus !== 'all' && t.transactionType === 'contribution') {
        if (filterReceiptStatus === 'delivered' && !t.receiptDelivered) return false;
        if (filterReceiptStatus === 'pending' && t.receiptDelivered) return false;
      }

      return true;
    });
  }, [transactions, filterType, filterPaymentStatus, filterReceiptStatus]);

  // Count active filters
  const activeFilterCount = [
    filterType !== 'all',
    filterPaymentStatus !== 'all',
    filterReceiptStatus !== 'all',
  ].filter(Boolean).length;

  // Reset all filters and clear localStorage
  const resetFilters = () => {
    setFilterType('all');
    setFilterPaymentStatus('all');
    setFilterReceiptStatus('all');
    localStorage.removeItem('hoa-filter-type');
    localStorage.removeItem('hoa-filter-payment');
    localStorage.removeItem('hoa-filter-receipt');
  };

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
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          Payment ✓
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
        Payment Pending
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
    setSelectedIds(new Set(filteredTransactions.map(t => `${t.transactionType}-${t.id}`)));
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

  const handleMarkAsPaid = async () => {
    try {
      setUpdating(true);

      // Group transactions by type
      const toUpdate = filteredTransactions.filter(t =>
        selectedIds.has(`${t.transactionType}-${t.id}`)
      );

      const contributionIds = toUpdate
        .filter(t => t.transactionType === 'contribution')
        .map(t => t.id);

      const expenseIds = toUpdate
        .filter(t => t.transactionType === 'expense')
        .map(t => t.id);

      // Bulk update payment status
      await bulkUpdatePaymentStatus(contributionIds, expenseIds, 'paid');

      // Reload transactions
      await loadTransactions();
      setSelectionMode(false);
      setSelectedIds(new Set());
      setShowMarkPaidConfirm(false);
    } catch (error) {
      console.error('Error marking transactions as paid:', error);
      alert('Failed to mark transactions as paid. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleMarkReceiptDelivered = async () => {
    try {
      setUpdating(true);

      // Get only contribution IDs
      const toUpdate = filteredTransactions.filter(t =>
        t.transactionType === 'contribution' && selectedIds.has(`${t.transactionType}-${t.id}`)
      );

      const contributionIds = toUpdate.map(t => t.id);

      // Bulk update receipt status
      await bulkUpdateReceiptStatus(contributionIds, true);

      // Reload transactions
      await loadTransactions();
      setSelectionMode(false);
      setSelectedIds(new Set());
      setShowMarkReceiptConfirm(false);
    } catch (error) {
      console.error('Error marking receipts as delivered:', error);
      alert('Failed to mark receipts as delivered. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  // Check if any contributions are selected
  const hasContributionsSelected = useMemo(() => {
    return filteredTransactions.some(t =>
      t.transactionType === 'contribution' && selectedIds.has(`${t.transactionType}-${t.id}`)
    );
  }, [filteredTransactions, selectedIds]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Filter Button */}
      {!loading && transactions.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Filter Panel */}
      {showFilters && (
        <div className="mb-4 bg-white rounded-xl shadow-md p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Transaction Type Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="contributions">Contributions</option>
                <option value="expenses">Expenses</option>
              </select>
            </div>

            {/* Payment Status Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Status</label>
              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Receipt Status Filter (only show when contributions are included) */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Receipt Status</label>
              <select
                value={filterReceiptStatus}
                onChange={(e) => setFilterReceiptStatus(e.target.value)}
                disabled={filterType === 'expenses'}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="all">All Receipts</option>
                <option value="delivered">Delivered</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Active Filters & Reset */}
          {activeFilterCount > 0 && (
            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex flex-wrap items-center gap-2">
                {filterType !== 'all' && (
                  <button
                    onClick={() => setFilterType('all')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
                  >
                    {filterType === 'contributions' ? 'Contributions' : 'Expenses'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {filterPaymentStatus !== 'all' && (
                  <button
                    onClick={() => setFilterPaymentStatus('all')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
                  >
                    {filterPaymentStatus === 'paid' ? 'Paid' : 'Pending'} Payment
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                {filterReceiptStatus !== 'all' && (
                  <button
                    onClick={() => setFilterReceiptStatus('all')}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
                  >
                    {filterReceiptStatus === 'delivered' ? 'Delivered' : 'Pending'} Receipt
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-600 font-semibold hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Reset All
              </button>
            </div>
          )}

          {/* Transaction Count */}
          <div className="text-sm text-gray-600 mt-3">
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </div>
        </div>
      )}

      {/* Action Toolbar */}
      {!loading && transactions.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {!selectionMode ? (
            <button
              onClick={() => setSelectionMode(true)}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Select
            </button>
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
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={selectedIds.size === filteredTransactions.length ? deselectAll : selectAll}
                  className="px-3 py-2 text-sm text-blue-600 font-semibold hover:bg-blue-50 rounded-lg transition-colors"
                >
                  {selectedIds.size === filteredTransactions.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={() => setShowMarkPaidConfirm(true)}
                  disabled={selectedIds.size === 0}
                  className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark as Paid
                </button>
                <button
                  onClick={() => setShowMarkReceiptConfirm(true)}
                  disabled={selectedIds.size === 0 || !hasContributionsSelected}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={!hasContributionsSelected ? 'No contributions selected' : ''}
                >
                  Mark Receipt Delivered
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={selectedIds.size === 0}
                  className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <p className="text-gray-600 text-lg">No transactions match your filters</p>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or reset them</p>
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => {
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
                      {transaction.transactionType === 'contribution' && (
                        transaction.receiptDelivered ? (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Receipt ✓
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                            Receipt Pending
                          </span>
                        )
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

      {/* Mark as Paid Confirmation */}
      {showMarkPaidConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mark {selectedIds.size} Transaction{selectedIds.size > 1 ? 's' : ''} as Paid?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will update the payment status of all selected transactions to "Paid".
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMarkPaidConfirm(false)}
                disabled={updating}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsPaid}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Receipt Delivered Confirmation */}
      {showMarkReceiptConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Mark Receipts as Delivered?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  This will mark all selected contributions' receipts as delivered.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowMarkReceiptConfirm(false)}
                disabled={updating}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkReceiptDelivered}
                disabled={updating}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {updating ? 'Updating...' : 'Mark Delivered'}
              </button>
            </div>
          </div>
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
