import { useState, useEffect } from 'react';
import { useFinancials } from '../hooks/useFinancials';
import { AddContributionForm } from './AddContributionForm';
import { AddExpenseForm } from './AddExpenseForm';
import { TransactionDetailModal } from './TransactionDetailModal';
import { getAllTransactions } from '../db/database';

export function Dashboard({ hoa, onViewAllTransactions, onExitDemo }) {
  const {
    financialSummary,
    loading,
    createContribution,
    createExpense,
    refresh,
  } = useFinancials(hoa.id);

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [collectionRateMode, setCollectionRateMode] = useState('overall'); // 'monthly', 'yearly', 'overall'
  const [quickStats, setQuickStats] = useState({
    collectionRate: 0,
    pendingContributions: 0,
    pendingExpenses: 0,
    outstandingReceipts: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, [hoa.id]);

  useEffect(() => {
    calculateQuickStats();
  }, [transactions, hoa, financialSummary, collectionRateMode]);

  const loadTransactions = async () => {
    try {
      const data = await getAllTransactions(hoa.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const calculateQuickStats = () => {
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentYear = now.getFullYear();

    let expectedTotal = 0;
    let actualTotal = financialSummary.totalContributions;

    if (collectionRateMode === 'monthly') {
      // Monthly: Expected for current month only
      expectedTotal = hoa.numberOfUnits * hoa.monthlyContribution;

      // Filter contributions for current month
      const currentMonthStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
      const contributionsThisMonth = transactions
        .filter(t => t.transactionType === 'contribution')
        .reduce((sum, t) => {
          // Check if contribution covers current month
          const startDate = new Date(t.startMonth + '-01');
          const endDate = t.endMonth ? new Date(t.endMonth + '-01') : startDate;
          const currentMonthDate = new Date(currentMonthStr + '-01');

          if (currentMonthDate >= startDate && currentMonthDate <= endDate) {
            return sum + t.amount;
          }
          return sum;
        }, 0);

      actualTotal = contributionsThisMonth;

    } else if (collectionRateMode === 'yearly') {
      // Yearly: Expected for current year (Jan to current month)
      const monthsThisYear = currentMonth + 1; // +1 because months are 0-indexed
      expectedTotal = hoa.numberOfUnits * hoa.monthlyContribution * monthsThisYear;

      // Filter contributions for current year
      const contributionsThisYear = transactions
        .filter(t => t.transactionType === 'contribution')
        .reduce((sum, t) => {
          const startDate = new Date(t.startMonth + '-01');
          if (startDate.getFullYear() === currentYear) {
            return sum + t.amount;
          }
          return sum;
        }, 0);

      actualTotal = contributionsThisYear;

    } else {
      // Overall: Total expected since HOA creation
      const hoaCreated = new Date(hoa.createdAt);
      const monthsSinceCreation = Math.max(1, Math.floor((now - hoaCreated) / (1000 * 60 * 60 * 24 * 30)));
      expectedTotal = hoa.numberOfUnits * hoa.monthlyContribution * monthsSinceCreation;
      actualTotal = financialSummary.totalContributions;
    }

    const collectionRate = expectedTotal > 0 ? (actualTotal / expectedTotal) * 100 : 0;

    // Separate pending contributions and pending expenses
    const pendingContributions = transactions.filter(
      t => t.transactionType === 'contribution' && t.paymentStatus === 'pending'
    ).length;

    const pendingExpenses = transactions.filter(
      t => t.transactionType === 'expense' && t.paymentStatus === 'pending'
    ).length;

    // Calculate outstanding receipts (contributions with receiptDelivered: false)
    const outstandingReceipts = transactions.filter(
      t => t.transactionType === 'contribution' && !t.receiptDelivered
    ).length;

    setQuickStats({
      collectionRate: Math.min(100, collectionRate), // Cap at 100%
      pendingContributions,
      pendingExpenses,
      outstandingReceipts,
    });
  };

  const handleCreateContribution = async (data) => {
    await createContribution(data);
    setShowContributionForm(false);
    loadTransactions();
  };

  const handleCreateExpense = async (data) => {
    await createExpense(data);
    setShowExpenseForm(false);
    loadTransactions();
  };

  const handleTransactionUpdate = () => {
    loadTransactions();
    refresh();
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

  return (
    <div className="pb-6 max-w-4xl mx-auto">
        {/* Demo Mode Banner */}
        {hoa.isDemo && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="bg-white rounded-full p-2">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div className="text-white">
                  <h3 className="font-bold text-lg">Demo Mode</h3>
                  <p className="text-sm text-orange-50">You're viewing sample data to explore the app</p>
                </div>
              </div>
              <button
                onClick={onExitDemo}
                className="bg-white text-orange-600 px-4 py-2 rounded-lg font-semibold hover:bg-orange-50 active:bg-orange-100 transition-colors shadow-md flex items-center gap-2 whitespace-nowrap"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit Demo & Start Fresh
              </button>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back!</h2>
          <p className="text-gray-600">Here's your HOA at a glance</p>
        </div>

        {/* Net Balance - Prominent */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-xl p-8 mb-6">
          <div className="text-blue-100 text-lg font-semibold mb-2">Net Balance</div>
          <div className={`text-5xl md:text-6xl font-bold mb-3 ${
            financialSummary.netBalance >= 0 ? 'text-white' : 'text-red-300'
          }`}>
            {loading ? '...' : `${financialSummary.netBalance >= 0 ? '' : '-'}$${Math.abs(financialSummary.netBalance).toFixed(2)}`}
          </div>
          <div className="flex items-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm">
                ${loading ? '...' : financialSummary.totalContributions.toFixed(2)} Contributions
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              <span className="text-sm">
                ${loading ? '...' : financialSummary.totalExpenses.toFixed(2)} Expenses
              </span>
            </div>
          </div>
          <div className={`mt-3 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
            financialSummary.netBalance >= 0
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}>
            {financialSummary.netBalance >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Collection Rate with Toggle */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-600">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Collection Rate</div>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className={`text-2xl font-bold ${
              quickStats.collectionRate >= 90 ? 'text-green-600' :
              quickStats.collectionRate >= 70 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {loading ? '...' : `${quickStats.collectionRate.toFixed(1)}%`}
            </div>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => setCollectionRateMode('monthly')}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  collectionRateMode === 'monthly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setCollectionRateMode('yearly')}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  collectionRateMode === 'yearly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Yearly
              </button>
              <button
                onClick={() => setCollectionRateMode('overall')}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded transition-colors ${
                  collectionRateMode === 'overall'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Overall
              </button>
            </div>
          </div>

          {/* Pending Contributions */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Pending Contributions</div>
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : quickStats.pendingContributions}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Awaiting payment
            </div>
          </div>

          {/* Pending Expenses */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Pending Expenses</div>
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : quickStats.pendingExpenses}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Awaiting payment
            </div>
          </div>

          {/* Outstanding Receipts */}
          <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-purple-600">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-700">Outstanding Receipts</div>
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {loading ? '...' : quickStats.outstandingReceipts}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Receipts to deliver
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setShowContributionForm(true)}
              className="bg-green-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors shadow-md hover:shadow-lg flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Contribution</span>
            </button>

            <button
              onClick={() => setShowExpenseForm(true)}
              className="bg-red-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-md hover:shadow-lg flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            {transactions.length > 0 && (
              <button
                onClick={onViewAllTransactions}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                View All
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <p className="text-gray-400 text-xs mt-1">Add a contribution or expense to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((transaction) => (
                <button
                  key={`${transaction.transactionType}-${transaction.id}`}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="w-full text-left border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:bg-gray-50 transition-all"
                >
                  <div className="flex justify-between items-center gap-3">
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
                        {transaction.paymentStatus === 'paid' ? (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                        {transaction.transactionType === 'contribution' && transaction.receiptDelivered && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            Receipt ✓
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">
                        {transaction.transactionType === 'contribution'
                          ? formatMonthRange(transaction.startMonth, transaction.endMonth)
                          : transaction.description || 'No description'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-lg font-bold ${
                        transaction.transactionType === 'contribution' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${transaction.amount.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

      {/* Modals */}
      {showContributionForm && (
        <AddContributionForm
          hoa={hoa}
          onCancel={() => setShowContributionForm(false)}
          onCreate={handleCreateContribution}
        />
      )}

      {showExpenseForm && (
        <AddExpenseForm
          onCancel={() => setShowExpenseForm(false)}
          onCreate={handleCreateExpense}
        />
      )}

      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
          onUpdate={handleTransactionUpdate}
        />
      )}
    </div>
  );
}
