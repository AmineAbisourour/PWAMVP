import { useState, useMemo } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { AddContributionForm } from './AddContributionForm';
import { AddExpenseForm } from './AddExpenseForm';
import { formatCurrency } from '../utils/currency';
import { getCurrencyForCountry, getLocaleForCountry } from '../utils/countries';

export function TransactionsPage({ hoa, onBack }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);

  // Use unified transactions hook
  const {
    transactions,
    loading,
    addContribution,
    addExpense,
    updateContribution,
    updateExpense,
    deleteContribution,
    deleteExpense,
    refresh,
  } = useTransactions(hoa.id);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'contributions', 'expenses'
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);

  const handleTogglePaymentStatus = async (transaction) => {
    try {
      const newStatus = transaction.paymentStatus === 'paid' ? 'pending' : 'paid';
      if (transaction.transactionType === 'contribution') {
        await updateContribution(transaction.id, { paymentStatus: newStatus });
      } else {
        await updateExpense(transaction.id, { paymentStatus: newStatus });
      }
    } catch (error) {
      // Error already logged by hook
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleToggleReceiptStatus = async (contribution) => {
    try {
      await updateContribution(contribution.id, {
        receiptDelivered: !contribution.receiptDelivered
      });
    } catch (error) {
      // Error already logged by hook
      alert('Failed to update receipt status. Please try again.');
    }
  };

  const handleDelete = async (transaction) => {
    if (!confirm(`Delete this ${transaction.transactionType}?`)) return;

    try {
      if (transaction.transactionType === 'contribution') {
        await deleteContribution(transaction.id);
      } else {
        await deleteExpense(transaction.id);
      }
    } catch (error) {
      // Error already logged by hook
      alert('Failed to delete transaction. Please try again.');
    }
  };

  const handleCreateContribution = async (data) => {
    try {
      await addContribution(data);
      setShowContributionForm(false);
    } catch (error) {
      // Error already logged by hook
      alert('Failed to create contribution. Please try again.');
    }
  };

  const handleCreateExpense = async (data) => {
    try {
      await addExpense(data);
      setShowExpenseForm(false);
    } catch (error) {
      // Error already logged by hook
      alert('Failed to create expense. Please try again.');
    }
  };

  const toggleGroup = (groupKey) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  // Calculate summary stats
  const stats = useMemo(() => {
    const contributions = transactions.filter(t => t.transactionType === 'contribution');
    const expenses = transactions.filter(t => t.transactionType === 'expense');

    const totalContributions = contributions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const netBalance = totalContributions - totalExpenses;

    return {
      totalContributions,
      contributionCount: contributions.length,
      totalExpenses,
      expenseCount: expenses.length,
      netBalance,
    };
  }, [transactions]);

  // Group contributions by month
  const contributionsByMonth = useMemo(() => {
    const contributions = transactions.filter(t => t.transactionType === 'contribution');
    const groups = {};

    contributions.forEach(contrib => {
      const monthKey = contrib.startMonth;
      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthKey,
          contributions: [],
          totalAmount: 0,
          paidAmount: 0,
          units: new Set(),
        };
      }

      groups[monthKey].contributions.push(contrib);
      groups[monthKey].totalAmount += contrib.amount;
      if (contrib.paymentStatus === 'paid') {
        groups[monthKey].paidAmount += contrib.amount;
      }
      groups[monthKey].units.add(contrib.unitNumber);
    });

    return Object.values(groups).sort((a, b) => b.month.localeCompare(a.month));
  }, [transactions]);

  // Group expenses by type
  const expensesByType = useMemo(() => {
    const expenses = transactions.filter(t => t.transactionType === 'expense');
    const groups = {};

    expenses.forEach(expense => {
      const type = expense.type || 'Other';
      if (!groups[type]) {
        groups[type] = {
          type,
          expenses: [],
          totalAmount: 0,
          paidAmount: 0,
        };
      }

      groups[type].expenses.push(expense);
      groups[type].totalAmount += expense.amount;
      if (expense.paymentStatus === 'paid') {
        groups[type].paidAmount += expense.amount;
      }
    });

    return Object.values(groups).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transactions]);

  const formatMonth = (monthKey) => {
    const date = new Date(monthKey + '-01');
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">All Transactions</h1>
          <p className="text-gray-600">
            Complete history of contributions and expenses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowContributionForm(true)}
            className="bg-green-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden md:inline">Add Contribution</span>
            <span className="md:hidden">Contribution</span>
          </button>
          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-red-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden md:inline">Add Expense</span>
            <span className="md:hidden">Expense</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Cards */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Contributions</h3>
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalContributions, currency, locale)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.contributionCount} transactions
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Total Expenses</h3>
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="text-3xl font-bold text-gray-900">
              {formatCurrency(stats.totalExpenses, currency, locale)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.expenseCount} transactions
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-600">Net Balance</h3>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <div className={`text-3xl font-bold ${
              stats.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatCurrency(stats.netBalance, currency, locale)}
            </div>
            <div className="text-sm text-gray-500 mt-1">
              {stats.netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'all'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
            <span className="ml-2 text-sm">({transactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('contributions')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'contributions'
                ? 'bg-green-50 text-green-600 border-b-2 border-green-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Contributions
            <span className="ml-2 text-sm">({stats.contributionCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex-1 px-6 py-4 font-semibold transition-colors ${
              activeTab === 'expenses'
                ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Expenses
            <span className="ml-2 text-sm">({stats.expenseCount})</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {transactions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600 mb-6">
                Start by adding your first contribution or expense to track your HOA finances.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowContributionForm(true)}
                  className="bg-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Contribution
                </button>
                <button
                  onClick={() => setShowExpenseForm(true)}
                  className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Expense
                </button>
              </div>
            </div>
          ) : activeTab === 'contributions' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Grouped by Month</h3>
              {contributionsByMonth.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No contributions found</p>
              ) : (
                contributionsByMonth.map(group => {
                  const collectionRate = group.totalAmount > 0
                    ? (group.paidAmount / group.totalAmount) * 100
                    : 0;
                  const isExpanded = expandedGroups.has(group.month);

                  return (
                    <div key={group.month} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                      {/* Group Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleGroup(group.month)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-gray-900">{formatMonth(group.month)}</h4>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                              collectionRate >= 90 ? 'bg-green-100 text-green-800' :
                              collectionRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {group.units.size} Units
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-green-600">
                                {formatCurrency(group.totalAmount, currency, locale)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {group.contributions.length} contributions
                              </div>
                            </div>
                            <svg
                              className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-300 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${collectionRate}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{collectionRate.toFixed(1)}% collected</span>
                          <span>{formatCurrency(group.paidAmount, currency, locale)} paid</span>
                        </div>
                      </div>

                      {/* Expanded Contributions */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {group.contributions
                              .sort((a, b) => a.unitNumber - b.unitNumber)
                              .map(contribution => (
                                <div
                                  key={contribution.id}
                                  className={`p-3 rounded-lg border-2 transition-all ${
                                    contribution.paymentStatus === 'paid'
                                      ? 'bg-green-50 border-green-300'
                                      : 'bg-white border-gray-300'
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="font-bold text-gray-900">Unit {contribution.unitNumber}</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(contribution);
                                      }}
                                      className="text-red-600 hover:text-red-700 p-1"
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                  <div className="text-sm font-semibold text-gray-700 mb-2">
                                    {formatCurrency(contribution.amount, currency, locale)}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePaymentStatus(contribution);
                                      }}
                                      className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${
                                        contribution.paymentStatus === 'paid'
                                          ? 'bg-green-200 text-green-800 hover:bg-green-300'
                                          : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                                      }`}
                                    >
                                      {contribution.paymentStatus === 'paid' ? '✓ Paid' : 'Mark Paid'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleToggleReceiptStatus(contribution);
                                      }}
                                      className={`text-xs px-2 py-1 rounded-full font-semibold transition-colors ${
                                        contribution.receiptDelivered
                                          ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                      }`}
                                    >
                                      {contribution.receiptDelivered ? '✓ Receipt' : 'Mark Receipt'}
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : activeTab === 'expenses' ? (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Grouped by Type</h3>
              {expensesByType.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No expenses found</p>
              ) : (
                expensesByType.map(group => {
                  const isExpanded = expandedGroups.has(group.type);

                  return (
                    <div key={group.type} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
                      {/* Group Header */}
                      <div
                        className="p-4 cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => toggleGroup(group.type)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h4 className="text-lg font-bold text-gray-900">{group.type}</h4>
                            <span className="px-3 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-700">
                              {group.expenses.length} expenses
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-xl font-bold text-red-600">
                                {formatCurrency(group.totalAmount, currency, locale)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(group.paidAmount, currency, locale)} paid
                              </div>
                            </div>
                            <svg
                              className={`w-6 h-6 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Expenses */}
                      {isExpanded && (
                        <div className="border-t border-gray-200 bg-white p-4">
                          <div className="space-y-2">
                            {group.expenses
                              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                              .map(expense => (
                                <div
                                  key={expense.id}
                                  className="flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex-1">
                                    <div className="font-semibold text-gray-900">
                                      {formatCurrency(expense.amount, currency, locale)}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {expense.description || 'No description'}
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      {new Date(expense.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                      })}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleTogglePaymentStatus(expense);
                                      }}
                                      className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                                        expense.paymentStatus === 'paid'
                                          ? 'bg-green-200 text-green-800 hover:bg-green-300'
                                          : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                                      }`}
                                    >
                                      {expense.paymentStatus === 'paid' ? '✓ Paid' : 'Mark Paid'}
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(expense);
                                      }}
                                      className="text-red-600 hover:text-red-700 p-2"
                                      title="Delete"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-gray-900 mb-4">All Transactions (Chronological)</h3>
              {transactions.map(transaction => (
                <div
                  key={`${transaction.transactionType}-${transaction.id}`}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    transaction.transactionType === 'contribution'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                          transaction.transactionType === 'contribution' ? 'bg-green-600' : 'bg-red-600'
                        }`}></span>
                        <span className="font-semibold text-gray-900">
                          {transaction.transactionType === 'contribution'
                            ? `Unit ${transaction.unitNumber}`
                            : transaction.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {transaction.transactionType === 'contribution'
                          ? formatMonth(transaction.startMonth)
                          : transaction.description || 'No description'}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTogglePaymentStatus(transaction);
                          }}
                          className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                            transaction.paymentStatus === 'paid'
                              ? 'bg-green-200 text-green-800 hover:bg-green-300'
                              : 'bg-orange-200 text-orange-800 hover:bg-orange-300'
                          }`}
                        >
                          {transaction.paymentStatus === 'paid' ? '✓ Paid' : 'Mark Paid'}
                        </button>
                        {transaction.transactionType === 'contribution' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleReceiptStatus(transaction);
                            }}
                            className={`text-xs px-3 py-1 rounded-full font-semibold transition-colors ${
                              transaction.receiptDelivered
                                ? 'bg-blue-200 text-blue-800 hover:bg-blue-300'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {transaction.receiptDelivered ? '✓ Receipt' : 'Mark Receipt'}
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(transaction);
                          }}
                          className="text-xs px-2 py-1 text-red-600 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div className={`text-xl font-bold flex-shrink-0 ${
                      transaction.transactionType === 'contribution' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount, currency, locale)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Forms */}
      {showContributionForm && (
        <AddContributionForm
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
