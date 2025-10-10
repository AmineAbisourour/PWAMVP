import { useState, useEffect } from 'react';
import { useTransactions } from '../hooks/useTransactions';
import { AddContributionWizard } from './AddContributionWizard';
import { AddExpenseForm } from './AddExpenseForm';
import { AddSpecialAssessmentForm } from './AddSpecialAssessmentForm';
import { addBulkSpecialAssessment, getSpecialAssessmentsByPurpose } from '../db/contributions';
import { formatCurrency } from '../utils/currency';
import { getCurrencyForCountry, getLocaleForCountry } from '../utils/countries';

export function Dashboard({ hoa, onViewAllTransactions, onViewWorkflow, onExitDemo }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);
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
    refresh,
  } = useTransactions(hoa.id);

  const [showContributionForm, setShowContributionForm] = useState(false);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showSpecialAssessmentForm, setShowSpecialAssessmentForm] = useState(false);
  const [specialAssessments, setSpecialAssessments] = useState([]);
  const [collectionRateMode, setCollectionRateMode] = useState('overall'); // 'monthly', 'yearly', 'overall'
  const [quickStats, setQuickStats] = useState({
    collectionRate: 0,
    pendingContributions: 0,
    pendingExpenses: 0,
    outstandingReceipts: 0,
  });

  useEffect(() => {
    loadSpecialAssessments();
  }, [hoa.id]);

  useEffect(() => {
    calculateQuickStats();
  }, [transactions, hoa, financialSummary, collectionRateMode]);

  const loadSpecialAssessments = async () => {
    try {
      const data = await getSpecialAssessmentsByPurpose(hoa.id);
      setSpecialAssessments(data);
    } catch {
      // Silently handle error
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
    await addContribution(data);
    setShowContributionForm(false);
  };

  const handleCreateExpense = async (data) => {
    await addExpense(data);
    setShowExpenseForm(false);
  };

  const handleCreateSpecialAssessment = async (data) => {
    try {
      await addBulkSpecialAssessment(data);
      setShowSpecialAssessmentForm(false);
      loadSpecialAssessments();
      refresh();
    } catch {
      alert('Failed to create special assessment. Please try again.');
    }
  };

  const handleTogglePaymentStatus = async (transaction) => {
    try {
      const newStatus = transaction.paymentStatus === 'paid' ? 'pending' : 'paid';
      if (transaction.transactionType === 'contribution') {
        await updateContribution(transaction.id, { paymentStatus: newStatus });
      } else {
        await updateExpense(transaction.id, { paymentStatus: newStatus });
      }
    } catch (error) {
      alert('Failed to update payment status. Please try again.');
    }
  };

  const handleToggleReceiptStatus = async (contribution) => {
    try {
      await updateContribution(contribution.id, {
        receiptDelivered: !contribution.receiptDelivered
      });
    } catch (error) {
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
      alert('Failed to delete transaction. Please try again.');
    }
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
    <>
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

        {/* Financial Overview */}

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border-t-4 border-blue-600">
          <h3 className="text-lg font-bold text-gray-900 mb-6">FINANCIAL OVERVIEW</h3>

          {/* Net Balance Header */}
          <div className="mb-6 pb-6 border-b">
            <div className="text-sm text-gray-600 mb-1">Net Balance (Actual Cash)</div>
            <div className={`text-4xl md:text-5xl font-bold ${
              financialSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {loading ? '...' : formatCurrency(financialSummary.netBalance, currency, locale)}
            </div>
          </div>

          {/* Split View: Contributions | Expenses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Contributions Column */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                CONTRIBUTIONS
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid:</span>
                  <span className="font-semibold text-green-700 flex items-center gap-1">
                    {loading ? '...' : formatCurrency(financialSummary.paidContributions, currency, locale)}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-semibold text-orange-600">
                    {loading ? '...' : formatCurrency(financialSummary.pendingContributions, currency, locale)}
                    <span className="text-xs text-gray-500 ml-1">({quickStats.pendingContributions})</span>
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${financialSummary.paidContributions + financialSummary.pendingContributions > 0
                          ? (financialSummary.paidContributions / (financialSummary.paidContributions + financialSummary.pendingContributions)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {financialSummary.paidContributions + financialSummary.pendingContributions > 0
                      ? `${((financialSummary.paidContributions / (financialSummary.paidContributions + financialSummary.pendingContributions)) * 100).toFixed(0)}% collected`
                      : '0% collected'}
                  </div>
                </div>
              </div>
            </div>

            {/* Expenses Column */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
                EXPENSES
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Paid:</span>
                  <span className="font-semibold text-green-700 flex items-center gap-1">
                    {loading ? '...' : formatCurrency(financialSummary.paidExpenses, currency, locale)}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Pending:</span>
                  <span className="font-semibold text-amber-600">
                    {loading ? '...' : formatCurrency(financialSummary.pendingExpenses, currency, locale)}
                    <span className="text-xs text-gray-500 ml-1">({quickStats.pendingExpenses})</span>
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${financialSummary.paidExpenses + financialSummary.pendingExpenses > 0
                          ? (financialSummary.paidExpenses / (financialSummary.paidExpenses + financialSummary.pendingExpenses)) * 100
                          : 0}%`
                      }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 text-right">
                    {financialSummary.paidExpenses + financialSummary.pendingExpenses > 0
                      ? `${((financialSummary.paidExpenses / (financialSummary.paidExpenses + financialSummary.pendingExpenses)) * 100).toFixed(0)}% paid`
                      : '0% paid'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Projected Balance */}
          {financialSummary.projectedBalance !== financialSummary.netBalance && (
            <div className="bg-blue-50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-900">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                <span className="font-semibold">Projected Balance:</span>
              </div>
              <span className="text-xl font-bold text-blue-900">
                {loading ? '...' : formatCurrency(financialSummary.projectedBalance, currency, locale)}
              </span>
            </div>
          )}
        </div>

        {/* Workflow Quick Access - New prominent card */}
        {quickStats.outstandingReceipts > 0 && (
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl p-6 mb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Receipt Workflow</h3>
                  <p className="text-blue-100 text-sm">Manage receipts & collections</p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-4xl font-bold mb-1">{quickStats.outstandingReceipts}</div>
                  <div className="text-blue-100">Receipts need attention</div>
                </div>
                <button
                  onClick={onViewWorkflow}
                  className="bg-white text-blue-600 px-6 py-3 rounded-xl font-bold hover:bg-blue-50 active:bg-blue-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <span>Open Workflow</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

            <button
              onClick={() => setShowSpecialAssessmentForm(true)}
              className="bg-purple-600 text-white py-4 px-4 rounded-xl font-semibold hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-md hover:shadow-lg flex flex-col items-center justify-center gap-2"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-center">Special Assessment</span>
            </button>
          </div>
        </div>

        {/* Special Assessments Summary */}
        {specialAssessments.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl shadow-md p-6 mb-6 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Active Special Assessments</h3>
                  <p className="text-sm text-gray-600">{specialAssessments.length} ongoing {specialAssessments.length === 1 ? 'project' : 'projects'}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {specialAssessments.slice(0, 3).map((assessment, index) => {
                const collectionRate = assessment.totalAmount > 0
                  ? (assessment.paidAmount / assessment.totalAmount) * 100
                  : 0;
                return (
                  <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{assessment.purpose}</h4>
                      <span className="px-2 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                        {assessment.paidCount}/{assessment.totalCount}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-semibold">{formatCurrency(assessment.totalAmount, currency, locale)}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${collectionRate}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Collected: {formatCurrency(assessment.paidAmount, currency, locale)}</span>
                        <span>Pending: {formatCurrency(assessment.pendingAmount, currency, locale)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {specialAssessments.length > 3 && (
              <p className="text-center text-sm text-purple-700 font-semibold mt-4">
                + {specialAssessments.length - 3} more assessment{specialAssessments.length - 3 > 1 ? 's' : ''}
              </p>
            )}
          </div>
        )}

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
                <div
                  key={`${transaction.transactionType}-${transaction.id}`}
                  className={`border-2 rounded-lg p-3 transition-all ${
                    transaction.transactionType === 'contribution'
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
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
                      <div className="text-xs text-gray-500 mb-2">
                        {transaction.transactionType === 'contribution'
                          ? formatMonthRange(transaction.startMonth, transaction.endMonth)
                          : transaction.description || 'No description'}
                      </div>
                      <div className="text-xs text-gray-400 mb-3">
                        {new Date(transaction.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
                    <div className={`text-lg font-bold flex-shrink-0 ${
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

      {/* Modals */}
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

      {showSpecialAssessmentForm && (
        <AddSpecialAssessmentForm
          hoa={hoa}
          onCancel={() => setShowSpecialAssessmentForm(false)}
          onCreate={handleCreateSpecialAssessment}
        />
      )}
    </>
  );
}
