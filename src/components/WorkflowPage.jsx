import { useState, useMemo } from "react";
import { useTransactions } from "../hooks/useTransactions";
import { bulkUpdateReceiptWorkflowStatus } from "../db/database";
import { formatCurrency } from "../utils/currency";
import { getCurrencyForCountry, getLocaleForCountry } from "../utils/countries";

export function WorkflowPage({ hoa, onBack }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);

  const {
    transactions,
    loading,
    updateContribution,
    refresh,
  } = useTransactions(hoa.id);

  const [activeTab, setActiveTab] = useState("to_print"); // 'to_print', 'ready_for_concierge', 'with_concierge', 'to_deliver', 'completed'
  const [selectedContributions, setSelectedContributions] = useState(new Set());

  // Filter contributions only (no expenses in workflow)
  const contributions = useMemo(() => {
    return transactions.filter(t => t.transactionType === 'contribution');
  }, [transactions]);

  // Workflow tab filtering
  const workflowData = useMemo(() => {
    return {
      to_print: contributions.filter(c =>
        c.receiptStatus === 'not_printed' && c.paymentStatus === 'pending'
      ),
      ready_for_concierge: contributions.filter(c =>
        c.receiptStatus === 'printed'
      ),
      with_concierge: contributions.filter(c =>
        c.receiptStatus === 'with_concierge' && c.paymentStatus === 'pending'
      ),
      to_deliver: contributions.filter(c =>
        c.paymentStatus === 'paid' && c.receiptStatus !== 'delivered'
      ),
      completed: contributions.filter(c =>
        c.paymentStatus === 'paid' && c.receiptStatus === 'delivered'
      ),
    };
  }, [contributions]);

  const currentData = workflowData[activeTab] || [];

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedContributions.size === currentData.length) {
      setSelectedContributions(new Set());
    } else {
      setSelectedContributions(new Set(currentData.map(c => c.id)));
    }
  };

  const toggleSelectContribution = (id) => {
    const newSelected = new Set(selectedContributions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedContributions(newSelected);
  };

  // Workflow action handlers
  const handlePrintReceipt = async (contributionId) => {
    try {
      await updateContribution(contributionId, { receiptStatus: 'printed' });
    } catch (error) {
      alert("Failed to update receipt status. Please try again.");
    }
  };

  const handleBulkPrintReceipts = async () => {
    if (!confirm(`Mark ${selectedContributions.size} receipt(s) as printed?`)) return;

    try {
      await bulkUpdateReceiptWorkflowStatus(Array.from(selectedContributions), 'printed');
      await refresh();
      setSelectedContributions(new Set());
    } catch (error) {
      alert("Failed to update receipts. Please try again.");
    }
  };

  const handleGiveToConcierge = async (contributionId) => {
    try {
      await updateContribution(contributionId, { receiptStatus: 'with_concierge' });
    } catch (error) {
      alert("Failed to update receipt status. Please try again.");
    }
  };

  const handleBulkGiveToConcierge = async () => {
    if (!confirm(`Give ${selectedContributions.size} receipt(s) to concierge?`)) return;

    try {
      await bulkUpdateReceiptWorkflowStatus(Array.from(selectedContributions), 'with_concierge');
      await refresh();
      setSelectedContributions(new Set());
    } catch (error) {
      alert("Failed to update receipts. Please try again.");
    }
  };

  const handleMarkPaid = async (contributionId) => {
    try {
      await updateContribution(contributionId, { paymentStatus: 'paid' });
    } catch (error) {
      alert("Failed to mark as paid. Please try again.");
    }
  };

  const handleBulkMarkPaid = async () => {
    if (!confirm(`Mark ${selectedContributions.size} payment(s) as received?`)) return;

    try {
      const promises = Array.from(selectedContributions).map(id =>
        updateContribution(id, { paymentStatus: 'paid' })
      );
      await Promise.all(promises);
      setSelectedContributions(new Set());
    } catch (error) {
      alert("Failed to update payments. Please try again.");
    }
  };

  const handleDeliverReceipt = async (contributionId) => {
    try {
      await updateContribution(contributionId, {
        receiptStatus: 'delivered',
        receiptDelivered: true
      });
    } catch (error) {
      alert("Failed to mark receipt as delivered. Please try again.");
    }
  };

  const handleBulkDeliverReceipts = async () => {
    if (!confirm(`Mark ${selectedContributions.size} receipt(s) as delivered?`)) return;

    try {
      await bulkUpdateReceiptWorkflowStatus(Array.from(selectedContributions), 'delivered');
      await refresh();
      setSelectedContributions(new Set());
    } catch (error) {
      alert("Failed to deliver receipts. Please try again.");
    }
  };

  const formatMonth = (monthKey) => {
    const date = new Date(monthKey + "-01");
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
  };

  const getDaysSince = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading workflow...</p>
      </div>
    );
  }

  const tabs = [
    { id: 'to_print', label: 'To Print', icon: '📝', count: workflowData.to_print.length, color: 'blue' },
    { id: 'ready_for_concierge', label: 'Ready', icon: '📋', count: workflowData.ready_for_concierge.length, color: 'purple' },
    { id: 'with_concierge', label: 'Collection', icon: '💰', count: workflowData.with_concierge.length, color: 'orange' },
    { id: 'to_deliver', label: 'To Deliver', icon: '🚚', count: workflowData.to_deliver.length, color: 'green' },
    { id: 'completed', label: 'Done', icon: '✅', count: workflowData.completed.length, color: 'gray' },
  ];

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back
          </button>
        </div>
        <h1 className="text-2xl font-bold">Receipt Workflow</h1>
        <p className="text-gray-600">Manage receipts from creation to delivery</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 overflow-x-auto">
        <div className="flex gap-2 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedContributions(new Set());
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? `bg-${tab.color}-600 text-white shadow-lg`
                  : 'bg-white text-gray-700 hover:bg-gray-50 shadow-md'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === tab.id
                    ? 'bg-white text-gray-900'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedContributions.size > 0 && (
        <div className="bg-blue-600 text-white rounded-xl shadow-lg p-4 mb-4 sticky top-4 z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="text-xs bg-white text-blue-600 px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                {selectedContributions.size === currentData.length ? 'Deselect All' : 'Select All'}
              </button>
              <span className="font-semibold">{selectedContributions.size} selected</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {activeTab === 'to_print' && (
                <button
                  onClick={handleBulkPrintReceipts}
                  className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
                >
                  Print All
                </button>
              )}
              {activeTab === 'ready_for_concierge' && (
                <button
                  onClick={handleBulkGiveToConcierge}
                  className="text-xs bg-orange-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
                >
                  Give to Concierge
                </button>
              )}
              {activeTab === 'with_concierge' && (
                <button
                  onClick={handleBulkMarkPaid}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Mark Paid
                </button>
              )}
              {activeTab === 'to_deliver' && (
                <button
                  onClick={handleBulkDeliverReceipts}
                  className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Deliver All
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {currentData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <span className="text-6xl mb-4 block">{tabs.find(t => t.id === activeTab)?.icon}</span>
          <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
          <p className="text-gray-600">
            No contributions in this workflow stage
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentData.map(contribution => {
            const isSelected = selectedContributions.has(contribution.id);
            const daysSince = getDaysSince(contribution.createdAt);

            return (
              <div
                key={contribution.id}
                className={`bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500 transition-all ${
                  isSelected ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectContribution(contribution.id)}
                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                  />

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl font-bold text-blue-600">
                            {formatCurrency(contribution.amount, currency, locale)}
                          </span>
                          {contribution.contributionType === 'special' && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                              SPECIAL
                            </span>
                          )}
                        </div>
                        <div className="text-lg font-semibold text-gray-900 mb-1">
                          Unit {contribution.unitNumber}
                        </div>
                        <div className="text-sm text-gray-600 mb-1">
                          {contribution.contributionType === 'special' && contribution.purpose
                            ? contribution.purpose
                            : formatMonth(contribution.startMonth)}
                        </div>
                        <div className="text-xs text-gray-400">
                          Created {daysSince} {daysSince === 1 ? 'day' : 'days'} ago
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {activeTab === 'to_print' && (
                        <button
                          onClick={() => handlePrintReceipt(contribution.id)}
                          className="text-xs px-4 py-2 rounded-lg font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                        >
                          📝 Print Receipt
                        </button>
                      )}
                      {activeTab === 'ready_for_concierge' && (
                        <button
                          onClick={() => handleGiveToConcierge(contribution.id)}
                          className="text-xs px-4 py-2 rounded-lg font-semibold bg-orange-600 text-white hover:bg-orange-700 transition-colors"
                        >
                          👤 Give to Concierge
                        </button>
                      )}
                      {activeTab === 'with_concierge' && (
                        <button
                          onClick={() => handleMarkPaid(contribution.id)}
                          className="text-xs px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          💰 Mark Paid
                        </button>
                      )}
                      {activeTab === 'to_deliver' && (
                        <>
                          {contribution.receiptStatus === 'not_printed' && (
                            <span className="text-xs px-3 py-2 rounded-lg font-semibold bg-yellow-100 text-yellow-800">
                              ⚠️ Receipt not printed yet
                            </span>
                          )}
                          <button
                            onClick={() => handleDeliverReceipt(contribution.id)}
                            className="text-xs px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
                          >
                            🚚 Deliver Receipt
                          </button>
                        </>
                      )}
                      {activeTab === 'completed' && (
                        <span className="text-xs px-3 py-2 rounded-lg font-semibold bg-green-100 text-green-800">
                          ✅ Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
