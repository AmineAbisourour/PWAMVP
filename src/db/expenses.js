/**
 * Expenses CRUD Operations
 * Handles all expense-related database operations
 */

import { initDB } from './init';
import { STORES, PAYMENT_STATUS, ERROR_MESSAGES } from './constants';

/**
 * Add a new expense
 * @param {Object} expenseData - Expense data
 * @returns {Promise<number>} ID of the created expense
 */
export async function addExpense(expenseData) {
  const db = await initDB();
  const expense = {
    ...expenseData,
    paymentStatus: expenseData.paymentStatus || PAYMENT_STATUS.PENDING,
    createdAt: new Date().toISOString(),
  };
  return db.add(STORES.EXPENSES, expense);
}

/**
 * Get all expenses for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Array of expenses
 */
export async function getExpensesByHOA(hoaId) {
  const db = await initDB();
  return db.getAllFromIndex(STORES.EXPENSES, 'hoaId', hoaId);
}

/**
 * Get expense by ID
 * @param {number} id - Expense ID
 * @returns {Promise<Object>} The expense object
 */
export async function getExpenseById(id) {
  const db = await initDB();
  return db.get(STORES.EXPENSES, id);
}

/**
 * Update an existing expense
 * @param {number} id - Expense ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<number>} The expense ID
 */
export async function updateExpense(id, updates) {
  const db = await initDB();
  const expense = await db.get(STORES.EXPENSES, id);
  if (!expense) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND('Expense', id));
  }
  const updatedExpense = {
    ...expense,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return db.put(STORES.EXPENSES, updatedExpense);
}

/**
 * Delete an expense by ID
 * @param {number} id - Expense ID
 * @returns {Promise<void>}
 */
export async function deleteExpense(id) {
  const db = await initDB();
  return db.delete(STORES.EXPENSES, id);
}

/**
 * Clear all expenses for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<void>}
 */
export async function clearExpensesByHOA(hoaId) {
  const db = await initDB();
  const expenses = await getExpensesByHOA(hoaId);
  const tx = db.transaction(STORES.EXPENSES, 'readwrite');
  await Promise.all(expenses.map(e => tx.store.delete(e.id)));
  await tx.done;
}
