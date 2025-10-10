import { useState, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { AddContributionWizard } from "./AddContributionWizard";
import { AddExpenseForm } from "./AddExpenseForm";
import { formatCurrency } from "../utils/currency";
import { getCurrencyForCountry, getLocaleForCountry } from "../utils/countries";

export function TransactionsPage({ hoa, onBack }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);

  // Use unified transactions hook
  const {
    transactions,
    financialSummary,
    loading,
    addContribution,
    addExpense,
    updateContribution,
    updateExpense,
    deleteContribution,
    deleteExpense,
  } = useTransactions(hoa.id);

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  // Filter state
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all"); // 'all', 'contributions', 'expenses'
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all"); // 'all', 'paid', 'pending'
  const [receiptStatusFilter, setReceiptStatusFilter] = useState("all"); // 'all', 'delivered', 'missing'

  // Bulk selection state
  const [selectedTransactions, setSelectedTransactions] = useState(new Set());

  // Sorting state
  const [sortBy, setSortBy] = useState("date"); // 'date', 'amount', 'unit'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc', 'desc'

  // Calculate metrics for cards
  const metrics = useMemo(() => {
    const totalTransactions = transactions.length;
    const contributionsCount = transactions.filter(t => t.transactionType === 'contribution').length;
    const expensesCount = transactions.filter(t => t.transactionType === 'expense').length;
    const pendingCount = transactions.filter(t => t.paymentStatus === 'pending').length;
    const outstandingReceipts = transactions.filter(
      t => t.transactionType === 'contribution' && !t.receiptDelivered
    ).length;

    return {
      totalTransactions,
      contributionsCount,
      expensesCount,
      pendingCount,
      outstandingReceipts,
    };
  }, [transactions]);

  // Apply filters and sorting
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Apply transaction type filter
    if (transactionTypeFilter === 'contributions') {
      filtered = filtered.filter(t => t.transactionType === 'contribution');
    } else if (transactionTypeFilter === 'expenses') {
      filtered = filtered.filter(t => t.transactionType === 'expense');
    }

    // Apply payment status filter
    if (paymentStatusFilter === 'paid') {
      filtered = filtered.filter(t => t.paymentStatus === 'paid');
    } else if (paymentStatusFilter === 'pending') {
      filtered = filtered.filter(t => t.paymentStatus === 'pending');
    }

    // Apply receipt status filter
    if (receiptStatusFilter === 'delivered') {
      filtered = filtered.filter(t => t.transactionType === 'contribution' && t.receiptDelivered);
    } else if (receiptStatusFilter === 'missing') {
      filtered = filtered.filter(t => t.transactionType === 'contribution' && !t.receiptDelivered);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'unit') {
        const aUnit = a.transactionType === 'contribution' ? a.unitNumber : 0;
        const bUnit = b.transactionType === 'contribution' ? b.unitNumber : 0;
        comparison = aUnit - bUnit;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, transactionTypeFilter, paymentStatusFilter, receiptStatusFilter, sortBy, sortOrder]);

  // Clear all filters
  const clearFilters = () => {
    setTransactionTypeFilter("all");
    setPaymentStatusFilter("all");
    setReceiptStatusFilter("all");
  };

  // Bulk selection handlers
  const toggleSelectAll = () => {
    if (selectedTransactions.size === filteredAndSortedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      const allIds = new Set(filteredAndSortedTransactions.map(t => `${t.transactionType}-${t.id}`));
      setSelectedTransactions(allIds);
    }
  };

  const toggleSelectTransaction = (transaction) => {
    const key = `${transaction.transactionType}-${transaction.id}`;
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedTransactions(newSelected);
  };

  // Bulk actions
  const handleBulkMarkAsPaid = async () => {
    if (!confirm(`Mark ${selectedTransactions.size} transaction(s) as paid?`)) return;

    try {
      const promises = Array.from(selectedTransactions).map(key => {
        const [type, id] = key.split('-');
        if (type === 'contribution') {
          return updateContribution(parseInt(id), { paymentStatus: 'paid' });
        } else {
          return updateExpense(parseInt(id), { paymentStatus: 'paid' });
        }
      });
      await Promise.all(promises);
      setSelectedTransactions(new Set());
    } catch (error) {
      alert("Failed to update some transactions. Please try again.");
    }
  };

  const handleBulkMarkReceiptsDelivered = async () => {
    const contributionKeys = Array.from(selectedTransactions).filter(key => key.startsWith('contribution-'));
    if (contributionKeys.length === 0) {
      alert("No contributions selected.");
      return;
    }

    if (!confirm(`Mark ${contributionKeys.length} receipt(s) as delivered?`)) return;

    try {
      const promises = contributionKeys.map(key => {
        const id = parseInt(key.split('-')[1]);
        return updateContribution(id, { receiptDelivered: true });
      });
      await Promise.all(promises);
      setSelectedTransactions(new Set());
    } catch (error) {
      alert("Failed to update some receipts. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedTransactions.size} transaction(s)? This cannot be undone.`)) return;

    try {
      const promises = Array.from(selectedTransactions).map(key => {
        const [type, id] = key.split('-');
        if (type === 'contribution') {
          return deleteContribution(parseInt(id));
        } else {
          return deleteExpense(parseInt(id));
        }
      });
      await Promise.all(promises);
      setSelectedTransactions(new Set());
    } catch (error) {
      alert("Failed to delete some transactions. Please try again.");
    }
  };

  // Individual transaction handlers
  const handleTogglePaymentStatus = async (transaction) => {
    try {
      const newStatus = transaction.paymentStatus === "paid" ? "pending" : "paid";
      if (transaction.transactionType === "contribution") {
        await updateContribution(transaction.id, { paymentStatus: newStatus });
      } else {
        await updateExpense(transaction.id, { paymentStatus: newStatus });
      }
    } catch (error) {
      alert("Failed to update payment status. Please try again.");
    }
  };

  const handleToggleReceiptStatus = async (contribution) => {
    try {
      await updateContribution(contribution.id, {
        receiptDelivered: !contribution.receiptDelivered,
      });
    } catch (error) {
      alert("Failed to update receipt status. Please try again.");
    }
  };

  const handleDelete = async (transaction) => {
    if (!confirm(`Delete this ${transaction.transactionType}?`)) return;

    try {
      if (transaction.transactionType === "contribution") {
        await deleteContribution(transaction.id);
      } else {
        await deleteExpense(transaction.id);
      }
    } catch (error) {
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleCreateContribution = async (data) => {
    try {
      await addContribution(data);
      setShowContributionForm(false);
    } catch (error) {
      alert("Failed to create contribution. Please try again.");
    }
  };

  const handleCreateExpense = async (data) => {
    try {
      await addExpense(data);
      setShowExpenseForm(false);
    } catch (error) {
      alert("Failed to create expense. Please try again.");
    }
  };

  const formatMonth = (monthKey) => {
    const date = new Date(monthKey + "-01");
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-balance">All Transactions</h1>
          <p className="text-gray-600">
            Complete history of contributions and expenses
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={() => setShowContributionForm(true)}
            className="bg-green-600 text-white px-3 py-2.5 sm:px-4 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">Add Contribution</span>
            <span className="sm:hidden">Contribution</span>
          </button>

          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-red-600 text-white px-3 py-2.5 sm:px-4 rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 flex-1 sm:flex-initial"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
            </svg>
            <span className="hidden sm:inline">Add Expense</span>
            <span className="sm:hidden">Expense</span>
          </button>
        </div>
      </div>

      {/* Information Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        {/* Total Transactions */}
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-blue-600">
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Total</div>
          <div className="text-2xl font-bold text-blue-600">{metrics.totalTransactions}</div>
          <div className="text-xs text-gray-600 mt-1">Transactions</div>
        </div>

        {/* Total Contributions */}
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-green-600">
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Contributions</div>
          <div className="text-xl md:text-2xl font-bold text-green-600 truncate">
            {formatCurrency(financialSummary.totalContributions, currency, locale)}
          </div>
          <div className="text-xs text-gray-600 mt-1">{metrics.contributionsCount} items</div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-red-600">
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Expenses</div>
          <div className="text-xl md:text-2xl font-bold text-red-600 truncate">
            {formatCurrency(financialSummary.totalExpenses, currency, locale)}
          </div>
          <div className="text-xs text-gray-600 mt-1">{metrics.expensesCount} items</div>
        </div>

        {/* Net Balance */}
        <div className={`bg-white rounded-xl shadow-md p-4 border-t-4 ${
          financialSummary.netBalance >= 0 ? 'border-green-600' : 'border-red-600'
        }`}>
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Net Balance</div>
          <div className={`text-xl md:text-2xl font-bold truncate ${
            financialSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(financialSummary.netBalance, currency, locale)}
          </div>
          <div className="text-xs text-gray-600 mt-1">Current</div>
        </div>

        {/* Pending Items */}
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-orange-600">
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Pending</div>
          <div className="text-2xl font-bold text-orange-600">{metrics.pendingCount}</div>
          <div className="text-xs text-gray-600 mt-1">Unpaid items</div>
        </div>

        {/* Outstanding Receipts */}
        <div className="bg-white rounded-xl shadow-md p-4 border-t-4 border-purple-600">
          <div className="text-xs text-gray-500 mb-1 uppercase font-semibold">Receipts</div>
          <div className="text-2xl font-bold text-purple-600">{metrics.outstandingReceipts}</div>
          <div className="text-xs text-gray-600 mt-1">Not delivered</div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
          <p className="text-gray-600 mb-6">
            Start by adding your first contribution or expense
          </p>
        </div>
      ) : (
        <>
          {/* Filter Pills */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-700 uppercase">Filters</h3>
              {(transactionTypeFilter !== 'all' || paymentStatusFilter !== 'all' || receiptStatusFilter !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              )}
            </div>

            {/* Transaction Type Filter */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2 font-semibold">Transaction Type</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setTransactionTypeFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    transactionTypeFilter === "all"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All ({transactions.length})
                </button>
                <button
                  onClick={() => setTransactionTypeFilter("contributions")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    transactionTypeFilter === "contributions"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Contributions ({metrics.contributionsCount})
                </button>
                <button
                  onClick={() => setTransactionTypeFilter("expenses")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    transactionTypeFilter === "expenses"
                      ? "bg-red-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Expenses ({metrics.expensesCount})
                </button>
              </div>
            </div>

            {/* Payment Status Filter */}
            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-2 font-semibold">Payment Status</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setPaymentStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    paymentStatusFilter === "all"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setPaymentStatusFilter("paid")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    paymentStatusFilter === "paid"
                      ? "bg-green-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Paid
                </button>
                <button
                  onClick={() => setPaymentStatusFilter("pending")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    paymentStatusFilter === "pending"
                      ? "bg-orange-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Pending ({metrics.pendingCount})
                </button>
              </div>
            </div>

            {/* Receipt Status Filter */}
            <div>
              <div className="text-xs text-gray-500 mb-2 font-semibold">Receipt Status</div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setReceiptStatusFilter("all")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    receiptStatusFilter === "all"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setReceiptStatusFilter("delivered")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    receiptStatusFilter === "delivered"
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Delivered
                </button>
                <button
                  onClick={() => setReceiptStatusFilter("missing")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    receiptStatusFilter === "missing"
                      ? "bg-purple-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Missing ({metrics.outstandingReceipts})
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {selectedTransactions.size > 0 && (
            <div className="bg-blue-600 text-white rounded-xl shadow-lg p-4 mb-4 sticky top-4 z-10">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                  >
                    {selectedTransactions.size === filteredAndSortedTransactions.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="font-semibold">{selectedTransactions.size} selected</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleBulkMarkAsPaid}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark Paid
                  </button>
                  <button
                    onClick={handleBulkMarkReceiptsDelivered}
                    className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Mark Receipts
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sorting Controls */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="text-sm font-semibold text-gray-700">
                {filteredAndSortedTransactions.length} transaction{filteredAndSortedTransactions.length !== 1 ? 's' : ''}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500 font-semibold">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="unit">Unit Number</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1"
                >
                  {sortOrder === 'asc' ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                      </svg>
                      Ascending
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      Descending
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          {filteredAndSortedTransactions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Matching Transactions</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your filters to see more results
              </p>
              <button
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedTransactions.map((transaction) => {
                const key = `${transaction.transactionType}-${transaction.id}`;
                const isSelected = selectedTransactions.has(key);

                return (
                  <div
                    key={key}
                    className={`bg-white rounded-xl shadow-md p-4 border-l-4 transition-all ${
                      transaction.transactionType === "contribution"
                        ? "border-green-500"
                        : "border-red-500"
                    } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectTransaction(transaction)}
                        className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />

                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-2xl font-bold ${
                                transaction.transactionType === "contribution" ? "text-green-600" : "text-red-600"
                              }`}>
                                {formatCurrency(transaction.amount, currency, locale)}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                transaction.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}>
                                {transaction.paymentStatus === 'paid' ? '✓ PAID' : 'PENDING'}
                              </span>
                              {transaction.transactionType === 'contribution' && (
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  transaction.receiptDelivered
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {transaction.receiptDelivered ? '✓ RECEIPT' : 'NO RECEIPT'}
                                </span>
                              )}
                            </div>
                            <div className="text-base font-semibold text-gray-900 mb-1">
                              {transaction.transactionType === "contribution"
                                ? `Unit ${transaction.unitNumber}`
                                : transaction.type}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {transaction.transactionType === "contribution"
                                ? formatMonth(transaction.startMonth)
                                : transaction.description || "No description"}
                            </div>
                            <div className="text-xs text-gray-400">
                              {new Date(transaction.createdAt).toLocaleDateString(locale, {
                                weekday: "short",
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleTogglePaymentStatus(transaction)}
                            className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                              transaction.paymentStatus === "paid"
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-orange-500 text-white hover:bg-orange-600"
                            }`}
                          >
                            {transaction.paymentStatus === "paid" ? "Mark Unpaid" : "Mark Paid"}
                          </button>
                          {transaction.transactionType === "contribution" && (
                            <button
                              onClick={() => handleToggleReceiptStatus(transaction)}
                              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                                transaction.receiptDelivered
                                  ? "bg-blue-600 text-white hover:bg-blue-700"
                                  : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                              }`}
                            >
                              {transaction.receiptDelivered ? "Unmark Receipt" : "Mark Receipt"}
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(transaction)}
                            className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Add Forms */}
      {showContributionForm && (
        <AddContributionWizard
          hoa={hoa}
          onCancel={() => setShowContributionForm(false)}
          onCreate={handleCreateContribution}
        />
      )}

      {showExpenseForm && (
        <AddExpenseForm
          hoa={hoa}
          onCancel={() => setShowExpenseForm(false)}
          onCreate={handleCreateExpense}
        />
      )}
    </>
  );
}
