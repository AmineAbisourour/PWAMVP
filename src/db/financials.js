/**
 * Financial Calculations Module
 * Handles all financial summary and calculation operations
 */

import { getHOAById } from './hoa';
import { getContributionsByHOA } from './contributions';
import { getExpensesByHOA } from './expenses';
import { CONTRIBUTION_TYPE, PAYMENT_STATUS } from './constants';

/**
 * Calculate total contributions for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<number>} Total contribution amount
 */
export async function getTotalContributions(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.reduce((total, contribution) => total + contribution.amount, 0);
}

/**
 * Calculate total expenses for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<number>} Total expense amount
 */
export async function getTotalExpenses(hoaId) {
  const expenses = await getExpensesByHOA(hoaId);
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

/**
 * Calculate net balance (contributions - expenses) for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<number>} Net balance
 */
export async function getNetBalance(hoaId) {
  const totalContributions = await getTotalContributions(hoaId);
  const totalExpenses = await getTotalExpenses(hoaId);
  return totalContributions - totalExpenses;
}

/**
 * Get opening balance for a HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<number>} Opening balance amount
 */
export async function getOpeningBalance(hoaId) {
  const hoa = await getHOAById(hoaId);
  return hoa?.openingBalance || 0;
}

/**
 * Get comprehensive financial summary with breakdown by contribution type
 * This is the single source of truth for all financial calculations
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Object>} Comprehensive financial summary
 */
export async function getFinancialSummary(hoaId) {
  const [hoa, contributions, expenses] = await Promise.all([
    getHOAById(hoaId),
    getContributionsByHOA(hoaId),
    getExpensesByHOA(hoaId),
  ]);

  // Separate contributions by type
  const regularContributions = contributions.filter(c => !c.contributionType || c.contributionType === CONTRIBUTION_TYPE.REGULAR);
  const specialAssessments = contributions.filter(c => c.contributionType === CONTRIBUTION_TYPE.SPECIAL);

  const regularTotal = regularContributions.reduce((sum, c) => sum + c.amount, 0);
  const specialTotal = specialAssessments.reduce((sum, c) => sum + c.amount, 0);
  const openingBalanceAmount = hoa?.openingBalance || 0;
  const totalContributions = regularTotal + specialTotal + openingBalanceAmount;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  // Separate by payment status for accurate cash position tracking
  const paidContributions = contributions
    .filter(c => c.paymentStatus === PAYMENT_STATUS.PAID)
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingContributions = contributions
    .filter(c => c.paymentStatus !== PAYMENT_STATUS.PAID)
    .reduce((sum, c) => sum + c.amount, 0);

  const paidExpenses = expenses
    .filter(e => e.paymentStatus === PAYMENT_STATUS.PAID)
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpenses = expenses
    .filter(e => e.paymentStatus !== PAYMENT_STATUS.PAID)
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Balance now reflects actual cash position (paid transactions only)
  const netBalance = (paidContributions + openingBalanceAmount) - paidExpenses;

  // Projected Balance includes pending transactions
  const projectedBalance = totalContributions - totalExpenses;

  return {
    // Totals (all transactions regardless of payment status)
    totalContributions,
    totalExpenses,

    // Payment status breakdown
    paidContributions,
    pendingContributions,
    paidExpenses,
    pendingExpenses,

    // Balances
    netBalance, // Actual cash position (paid only)
    projectedBalance, // Expected position after all pending transactions complete

    // Breakdown by contribution type
    regularContributions: regularTotal,
    specialAssessments: specialTotal,
    openingBalance: openingBalanceAmount,

    // Counts
    regularContributionsCount: regularContributions.length,
    specialAssessmentsCount: specialAssessments.length,
    expensesCount: expenses.length,
    paidContributionsCount: contributions.filter(c => c.paymentStatus === PAYMENT_STATUS.PAID).length,
    pendingContributionsCount: contributions.filter(c => c.paymentStatus !== PAYMENT_STATUS.PAID).length,
    paidExpensesCount: expenses.filter(e => e.paymentStatus === PAYMENT_STATUS.PAID).length,
    pendingExpensesCount: expenses.filter(e => e.paymentStatus !== PAYMENT_STATUS.PAID).length,

    // Detailed arrays
    contributions,
    expenses,
  };
}
