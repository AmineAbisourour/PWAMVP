/**
 * Unified Transactions Operations
 * Handles combined views of contributions and expenses
 */

import { getContributionsByHOA, clearContributionsByHOA } from './contributions';
import { getExpensesByHOA, clearExpensesByHOA } from './expenses';
import { TRANSACTION_TYPE, CONTRIBUTION_TYPE, PAYMENT_STATUS, RECEIPT_STATUS } from './constants';

/**
 * Get all transactions (contributions + expenses) for a specific HOA, sorted by date
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Combined array of transactions
 */
export async function getAllTransactions(hoaId) {
  const [contributions, expenses] = await Promise.all([
    getContributionsByHOA(hoaId),
    getExpensesByHOA(hoaId),
  ]);

  // Filter out old opening balance contributions (for backward compatibility)
  // Opening balance is now stored as a property of the HOA record
  const filteredContributions = contributions.filter(c => c.contributionType !== CONTRIBUTION_TYPE.OPENING);

  // Add transactionType field to differentiate between contributions and expenses
  const contributionsWithType = filteredContributions.map(c => ({
    ...c,
    transactionType: TRANSACTION_TYPE.CONTRIBUTION,
    // Ensure status fields have defaults for existing records
    paymentStatus: c.paymentStatus || PAYMENT_STATUS.PENDING,
    receiptDelivered: c.receiptDelivered || false,
    receiptStatus: c.receiptStatus || RECEIPT_STATUS.NOT_PRINTED,
    contributionType: c.contributionType || CONTRIBUTION_TYPE.REGULAR,
    purpose: c.purpose || null,
  }));

  const expensesWithType = expenses.map(e => ({
    ...e,
    transactionType: TRANSACTION_TYPE.EXPENSE,
    // Ensure status field has default for existing records
    paymentStatus: e.paymentStatus || PAYMENT_STATUS.PENDING,
  }));

  // Combine and sort by createdAt (newest first)
  return [...contributionsWithType, ...expensesWithType]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * Delete all transactions (contributions + expenses) for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<void>}
 */
export async function clearAllTransactions(hoaId) {
  await Promise.all([
    clearContributionsByHOA(hoaId),
    clearExpensesByHOA(hoaId),
  ]);
}
