import { useState, useEffect } from 'react';
import { useFinancials } from '../hooks/useFinancials';
import { AddContributionForm } from './AddContributionForm';
import { AddExpenseForm } from './AddExpenseForm';
import { TransactionDetailModal } from './TransactionDetailModal';
import { getAllTransactions } from '../db/database';

export function Dashboard({ hoa, onViewAllTransactions }) {
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

  useEffect(() => {
    loadTransactions();
  }, [hoa.id]);

  const loadTransactions = async () => {
    try {
      const data = await getAllTransactions(hoa.id);
      setTransactions(data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
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
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg safe-area-inset">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{hoa.name}</h1>
          <p className="text-blue-100 text-sm mt-1">{hoa.address}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Contributions</div>
            <div className="text-3xl font-bold text-green-600">
              ${loading ? '...' : financialSummary.totalContributions.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {financialSummary.contributionsCount} payment{financialSummary.contributionsCount !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Total Expenses</div>
            <div className="text-3xl font-bold text-red-600">
              ${loading ? '...' : financialSummary.totalExpenses.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {financialSummary.expensesCount} expense{financialSummary.expensesCount !== 1 ? 's' : ''}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="text-sm text-gray-600 mb-1">Net Balance</div>
            <div className={`text-3xl font-bold ${
              financialSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ${loading ? '...' : Math.abs(financialSummary.netBalance).toFixed(2)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {financialSummary.netBalance >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => setShowContributionForm(true)}
            className="bg-green-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-green-700 active:bg-green-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Contribution
          </button>

          <button
            onClick={() => setShowExpenseForm(true)}
            className="bg-red-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-red-700 active:bg-red-800 transition-colors shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Expense
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions
            </h3>
            {transactions.length > 0 && (
              <button
                onClick={onViewAllTransactions}
                className="text-sm text-blue-600 hover:text-blue-700 font-semibold"
              >
                Show All
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {transactions.slice(0, 10).map((transaction) => (
                <button
                  key={`${transaction.transactionType}-${transaction.id}`}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="w-full text-left border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
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
                      <div className="text-sm text-gray-600">
                        {transaction.transactionType === 'contribution'
                          ? formatMonthRange(transaction.startMonth, transaction.endMonth)
                          : transaction.description || 'No description'}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className={`font-bold ${
                        transaction.transactionType === 'contribution' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        ${transaction.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(transaction.createdAt).toLocaleDateString()}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

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
