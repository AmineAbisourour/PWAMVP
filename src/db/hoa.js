/**
 * HOA CRUD Operations
 * Handles all HOA-related database operations
 */

import { initDB } from './init';
import { STORES, ERROR_MESSAGES } from './constants';

/**
 * Create a new HOA
 * @param {Object} hoaData - HOA data
 * @returns {Promise<number>} ID of the created HOA
 */
export async function createHOA(hoaData) {
  const db = await initDB();
  const hoa = {
    country: 'MA', // Default country (Morocco)
    ...hoaData,
    createdAt: new Date().toISOString(),
  };
  return db.add(STORES.HOA, hoa);
}

/**
 * Get all HOAs
 * @returns {Promise<Array>} Array of all HOAs
 */
export async function getAllHOAs() {
  const db = await initDB();
  return db.getAll(STORES.HOA);
}

/**
 * Get HOA by ID
 * @param {number} id - HOA ID
 * @returns {Promise<Object>} The HOA object
 */
export async function getHOAById(id) {
  const db = await initDB();
  return db.get(STORES.HOA, id);
}

/**
 * Update an existing HOA
 * @param {number} id - HOA ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<number>} The HOA ID
 */
export async function updateHOA(id, updates) {
  const db = await initDB();
  const hoa = await db.get(STORES.HOA, id);
  if (!hoa) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND('HOA', id));
  }
  const updatedHOA = {
    ...hoa,
    ...updates,
    id, // Preserve the original ID
    updatedAt: new Date().toISOString(),
  };
  return db.put(STORES.HOA, updatedHOA);
}

/**
 * Delete an HOA by ID
 * @param {number} id - HOA ID
 * @returns {Promise<void>}
 */
export async function deleteHOA(id) {
  const db = await initDB();
  return db.delete(STORES.HOA, id);
}

/**
 * Clear all HOAs
 * @returns {Promise<void>}
 */
export async function clearAllHOAs() {
  const db = await initDB();
  return db.clear(STORES.HOA);
}

/**
 * Get total number of HOAs
 * @returns {Promise<number>} Count of HOAs
 */
export async function getHOACount() {
  const db = await initDB();
  return db.count(STORES.HOA);
}
