/**
 * Database Initialization Module
 * Handles IndexedDB setup and schema migrations
 */

import { openDB } from 'idb';
import { DB_NAME, DB_VERSION, STORES } from './constants';

/**
 * Initialize the IndexedDB database
 * @returns {Promise<IDBDatabase>} The initialized database instance
 */
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create HOA object store if it doesn't exist
      if (!db.objectStoreNames.contains(STORES.HOA)) {
        const store = db.createObjectStore(STORES.HOA, {
          keyPath: 'id',
          autoIncrement: true,
        });
        store.createIndex('name', 'name');
        store.createIndex('createdAt', 'createdAt');
      }

      // Create Contributions object store (version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.CONTRIBUTIONS)) {
        const contributionsStore = db.createObjectStore(STORES.CONTRIBUTIONS, {
          keyPath: 'id',
          autoIncrement: true,
        });
        contributionsStore.createIndex('hoaId', 'hoaId');
        contributionsStore.createIndex('unitNumber', 'unitNumber');
        contributionsStore.createIndex('startMonth', 'startMonth');
        contributionsStore.createIndex('createdAt', 'createdAt');
      }

      // Create Expenses object store (version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(STORES.EXPENSES)) {
        const expensesStore = db.createObjectStore(STORES.EXPENSES, {
          keyPath: 'id',
          autoIncrement: true,
        });
        expensesStore.createIndex('hoaId', 'hoaId');
        expensesStore.createIndex('type', 'type');
        expensesStore.createIndex('createdAt', 'createdAt');
      }

      // Version 3: Add receiptStatus field to existing contributions
      if (oldVersion < 3 && db.objectStoreNames.contains(STORES.CONTRIBUTIONS)) {
        const contributionsStore = transaction.objectStore(STORES.CONTRIBUTIONS);
        const allContributions = contributionsStore.getAll();

        allContributions.onsuccess = () => {
          const contributions = allContributions.result;
          contributions.forEach(contribution => {
            // Migrate existing data: set receiptStatus based on receiptDelivered
            let receiptStatus = 'not_printed'; // default

            if (contribution.receiptDelivered === true) {
              receiptStatus = 'delivered';
            } else if (contribution.paymentStatus === 'paid') {
              // If paid but not delivered, assume receipt is printed and with concierge
              receiptStatus = 'with_concierge';
            }

            contribution.receiptStatus = receiptStatus;
            contributionsStore.put(contribution);
          });
        };
      }

      // Version 4: Add contribution rate history to HOAs
      if (oldVersion < 4 && db.objectStoreNames.contains(STORES.HOA)) {
        const hoaStore = transaction.objectStore(STORES.HOA);
        const allHOAs = hoaStore.getAll();

        allHOAs.onsuccess = () => {
          const hoas = allHOAs.result;
          hoas.forEach(hoa => {
            // Initialize rate history from current rate if not exists
            if (!hoa.contributionRateHistory) {
              const createdDate = hoa.createdAt ? hoa.createdAt.substring(0, 7) : new Date().toISOString().substring(0, 7);
              hoa.contributionRateHistory = [{
                effectiveDate: createdDate, // YYYY-MM format
                amount: hoa.monthlyContribution || 0,
                note: "Initial rate"
              }];
            }
            hoaStore.put(hoa);
          });
        };
      }
    },
  });
}
