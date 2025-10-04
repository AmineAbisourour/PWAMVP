import { useState, useEffect } from "react";
import {
  getFinancialSummary,
  getAllTransactions,
} from "../db/database";
import { formatCurrency } from "../utils/currency";
import { getCurrencyForCountry, getLocaleForCountry } from "../utils/countries";

export function Reports({ hoa }) {
  const currency = getCurrencyForCountry(hoa.country);
  const locale = getLocaleForCountry(hoa.country);
  const [summary, setSummary] = useState(null);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [hoa.id]);

  const loadReports = async () => {
    try {
      setLoading(true);
      // Get financial summary with breakdown
      const financialSummary = await getFinancialSummary(hoa.id);
      setSummary(financialSummary);

      // Get all transactions for monthly breakdown
      const transactions = await getAllTransactions(hoa.id);
      const breakdown = calculateMonthlyBreakdown(transactions);
      setMonthlyBreakdown(breakdown);
    } catch (error) {
      console.error("Error loading reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyBreakdown = (transactions) => {
    const monthlyData = {};

    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          contributions: 0,
          expenses: 0,
          contributionCount: 0,
          expenseCount: 0,
        };
      }

      if (transaction.transactionType === "contribution") {
        monthlyData[monthKey].contributions += transaction.amount;
        monthlyData[monthKey].contributionCount += 1;
      } else {
        monthlyData[monthKey].expenses += transaction.amount;
        monthlyData[monthKey].expenseCount += 1;
      }
    });

    // Convert to array and sort by month (newest first)
    return Object.values(monthlyData).sort((a, b) =>
      b.month.localeCompare(a.month)
    );
  };

  const formatMonth = (monthKey) => {
    const [year, month] = monthKey.split("-");
    const date = new Date(year, parseInt(month) - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  return (
    <>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Financial Reports
        </h1>
        <p className="text-gray-600">
          Overview of {hoa.name}'s financial performance
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">
              Total Contributions
            </h3>
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary?.totalContributions, currency, locale)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {(summary?.regularContributionsCount || 0) +
              (summary?.specialAssessmentsCount || 0)}{" "}
            transactions
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">
              Total Expenses
            </h3>
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {formatCurrency(summary?.totalExpenses, currency, locale)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {summary?.expenseCount || 0} transactions
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-600">Net Balance</h3>
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div
            className={`text-3xl font-bold ${
              (summary?.netBalance || 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(summary?.netBalance, currency, locale)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {(summary?.netBalance || 0) >= 0 ? "Surplus" : "Deficit"}
          </div>
        </div>
      </div>

      {/* Contributions Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Contributions Breakdown
        </h2>
        <div className="space-y-4">
          {/* Regular Contributions */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <div className="bg-green-600 rounded-full p-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Regular Contributions
                </h3>
                <p className="text-sm text-gray-600">
                  Monthly contributions from units
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(summary?.regularContributions, currency, locale)}
              </div>
              <div className="text-xs text-gray-500">
                {summary?.regularContributionsCount || 0} transactions
              </div>
            </div>
          </div>

          {/* Special Assessments */}
          <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-3">
              <div className="bg-purple-600 rounded-full p-2">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  Special Assessments
                </h3>
                <p className="text-sm text-gray-600">
                  Extraordinary contributions for projects
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary?.specialAssessments, currency, locale)}
              </div>
              <div className="text-xs text-gray-500">
                {summary?.specialAssessmentsCount || 0} transactions
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          {summary?.openingBalance !== 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 rounded-full p-2">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Opening Balance
                  </h3>
                  <p className="text-sm text-gray-600">
                    Initial balance from previous management
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`text-2xl font-bold ${
                    (summary?.openingBalance || 0) >= 0
                      ? "text-blue-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(summary?.openingBalance || 0, currency, locale)}
                </div>
                <div className="text-xs text-gray-500">
                  {(summary?.openingBalance || 0) >= 0 ? "Surplus" : "Deficit"}
                </div>
              </div>
            </div>
          )}

          {/* Total Breakdown Bar */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-gray-700">
                Total Breakdown
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(summary?.totalContributions || 0, currency, locale)}
              </span>
            </div>
            <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
              {summary?.totalContributions > 0 && (
                <>
                  {summary.regularContributions > 0 && (
                    <div
                      className="bg-green-600 h-full"
                      style={{
                        width: `${
                          (summary.regularContributions /
                            summary.totalContributions) *
                          100
                        }%`,
                      }}
                      title={`Regular: ${(
                        (summary.regularContributions /
                          summary.totalContributions) *
                        100
                      ).toFixed(1)}%`}
                    ></div>
                  )}
                  {summary.specialAssessments > 0 && (
                    <div
                      className="bg-purple-600 h-full"
                      style={{
                        width: `${
                          (summary.specialAssessments /
                            summary.totalContributions) *
                          100
                        }%`,
                      }}
                      title={`Special: ${(
                        (summary.specialAssessments /
                          summary.totalContributions) *
                        100
                      ).toFixed(1)}%`}
                    ></div>
                  )}
                  {summary.openingBalance > 0 && (
                    <div
                      className="bg-blue-600 h-full"
                      style={{
                        width: `${
                          (summary.openingBalance /
                            summary.totalContributions) *
                          100
                        }%`,
                      }}
                      title={`Opening: ${(
                        (summary.openingBalance / summary.totalContributions) *
                        100
                      ).toFixed(1)}%`}
                    ></div>
                  )}
                </>
              )}
            </div>
            <div className="flex gap-4 mt-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-600 rounded"></div>
                <span>
                  Regular (
                  {summary?.totalContributions > 0
                    ? (
                        (summary.regularContributions /
                          summary.totalContributions) *
                        100
                      ).toFixed(1)
                    : 0}
                  %)
                </span>
              </div>
              {summary?.specialAssessments > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-purple-600 rounded"></div>
                  <span>
                    Special (
                    {(
                      (summary.specialAssessments /
                        summary.totalContributions) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              )}
              {summary?.openingBalance > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-600 rounded"></div>
                  <span>
                    Opening (
                    {(
                      (summary.openingBalance / summary.totalContributions) *
                      100
                    ).toFixed(1)}
                    %)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Monthly Breakdown
        </h2>

        {monthlyBreakdown.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transaction data available yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Month
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Contributions
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Expenses
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Net
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody>
                {monthlyBreakdown.map((month) => {
                  const net = month.contributions - month.expenses;
                  return (
                    <tr
                      key={month.month}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 text-gray-900 font-medium">
                        {formatMonth(month.month)}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 font-semibold">
                        {formatCurrency(month.contributions, currency, locale)}
                      </td>
                      <td className="py-3 px-4 text-right text-red-600 font-semibold">
                        {formatCurrency(month.expenses, currency, locale)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-bold ${
                          net >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(net, currency, locale)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600 text-sm">
                        {month.contributionCount + month.expenseCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* HOA Details */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">HOA Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">Number of Units</div>
            <div className="text-2xl font-bold text-gray-900">
              {hoa.numberOfUnits}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Monthly Contribution Rate
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(hoa.monthlyContribution, currency, locale)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              Expected Monthly Income
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(hoa.numberOfUnits * hoa.monthlyContribution, currency, locale)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">Collection Rate</div>
            <div className="text-2xl font-bold text-gray-900">
              {monthlyBreakdown.length > 0 ? (
                <>
                  {(
                    (monthlyBreakdown[0].contributions /
                      (hoa.numberOfUnits * hoa.monthlyContribution)) *
                    100
                  ).toFixed(1)}
                  %
                </>
              ) : (
                "N/A"
              )}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {monthlyBreakdown.length > 0
                ? formatMonth(monthlyBreakdown[0].month)
                : "No data"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
