/**
 * Bulk Operations Module
 * Handles batch operations on transactions
 */

import { initDB } from './init';
import { STORES } from './constants';

/**
 * Bulk update payment status for contributions and expenses
 * @param {Array<number>} contributionIds - Array of contribution IDs
 * @param {Array<number>} expenseIds - Array of expense IDs
 * @param {string} status - Payment status ('paid' | 'pending')
 * @returns {Promise<void>}
 */
export async function bulkUpdatePaymentStatus(contributionIds, expenseIds, status) {
  const db = await initDB();
  const updates = [];

  // Update contributions
  if (contributionIds.length > 0) {
    const contributionUpdates = contributionIds.map(async (id) => {
      const contribution = await db.get(STORES.CONTRIBUTIONS, id);
      if (contribution) {
        return db.put(STORES.CONTRIBUTIONS, {
          ...contribution,
          paymentStatus: status,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    updates.push(...contributionUpdates);
  }

  // Update expenses
  if (expenseIds.length > 0) {
    const expenseUpdates = expenseIds.map(async (id) => {
      const expense = await db.get(STORES.EXPENSES, id);
      if (expense) {
        return db.put(STORES.EXPENSES, {
          ...expense,
          paymentStatus: status,
          updatedAt: new Date().toISOString(),
        });
      }
    });
    updates.push(...expenseUpdates);
  }

  await Promise.all(updates);
}

/**
 * Bulk update receipt delivered status for contributions
 * @param {Array<number>} contributionIds - Array of contribution IDs
 * @param {boolean} delivered - Receipt delivered status
 * @returns {Promise<void>}
 */
export async function bulkUpdateReceiptStatus(contributionIds, delivered) {
  const db = await initDB();

  const updates = contributionIds.map(async (id) => {
    const contribution = await db.get(STORES.CONTRIBUTIONS, id);
    if (contribution) {
      return db.put(STORES.CONTRIBUTIONS, {
        ...contribution,
        receiptDelivered: delivered,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  await Promise.all(updates);
}

/**
 * Bulk update receipt workflow status for contributions
 * @param {Array<number>} contributionIds - Array of contribution IDs
 * @param {string} receiptStatus - Receipt status ('not_printed' | 'printed' | 'with_concierge' | 'delivered')
 * @returns {Promise<void>}
 */
export async function bulkUpdateReceiptWorkflowStatus(contributionIds, receiptStatus) {
  const db = await initDB();

  const updates = contributionIds.map(async (id) => {
    const contribution = await db.get(STORES.CONTRIBUTIONS, id);
    if (contribution) {
      const updates = {
        receiptStatus,
        updatedAt: new Date().toISOString(),
      };

      // Auto-update receiptDelivered when status is 'delivered'
      if (receiptStatus === 'delivered') {
        updates.receiptDelivered = true;
      }

      return db.put(STORES.CONTRIBUTIONS, {
        ...contribution,
        ...updates,
      });
    }
  });

  await Promise.all(updates);
}
