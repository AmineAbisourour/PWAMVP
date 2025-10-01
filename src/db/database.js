import { openDB } from 'idb';

const DB_NAME = 'HOA_PWA_DB';
const DB_VERSION = 2;
const HOA_STORE = 'hoas';
const CONTRIBUTIONS_STORE = 'contributions';
const EXPENSES_STORE = 'expenses';

// Initialize the database
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create HOA object store if it doesn't exist
      if (!db.objectStoreNames.contains(HOA_STORE)) {
        const store = db.createObjectStore(HOA_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        // Create indexes for querying
        store.createIndex('name', 'name');
        store.createIndex('createdAt', 'createdAt');
      }

      // Create Contributions object store (version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(CONTRIBUTIONS_STORE)) {
        const contributionsStore = db.createObjectStore(CONTRIBUTIONS_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        contributionsStore.createIndex('hoaId', 'hoaId');
        contributionsStore.createIndex('unitNumber', 'unitNumber');
        contributionsStore.createIndex('startMonth', 'startMonth');
        contributionsStore.createIndex('createdAt', 'createdAt');
      }

      // Create Expenses object store (version 2)
      if (oldVersion < 2 && !db.objectStoreNames.contains(EXPENSES_STORE)) {
        const expensesStore = db.createObjectStore(EXPENSES_STORE, {
          keyPath: 'id',
          autoIncrement: true,
        });
        expensesStore.createIndex('hoaId', 'hoaId');
        expensesStore.createIndex('type', 'type');
        expensesStore.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

// HOA CRUD Operations

// Create - Add a new HOA
export async function createHOA(hoaData) {
  const db = await initDB();
  const hoa = {
    ...hoaData,
    createdAt: new Date().toISOString(),
  };
  return db.add(HOA_STORE, hoa);
}

// Read - Get all HOAs
export async function getAllHOAs() {
  const db = await initDB();
  return db.getAll(HOA_STORE);
}

// Read - Get HOA by ID
export async function getHOAById(id) {
  const db = await initDB();
  return db.get(HOA_STORE, id);
}

// Update - Update an existing HOA
export async function updateHOA(id, updates) {
  const db = await initDB();
  const hoa = await db.get(HOA_STORE, id);
  if (!hoa) {
    throw new Error(`HOA with id ${id} not found`);
  }
  const updatedHOA = {
    ...hoa,
    ...updates,
    id, // Preserve the original ID
    updatedAt: new Date().toISOString(),
  };
  return db.put(HOA_STORE, updatedHOA);
}

// Delete - Remove an HOA by ID
export async function deleteHOA(id) {
  const db = await initDB();
  return db.delete(HOA_STORE, id);
}

// Delete - Clear all HOAs
export async function clearAllHOAs() {
  const db = await initDB();
  return db.clear(HOA_STORE);
}

// Count - Get total number of HOAs
export async function getHOACount() {
  const db = await initDB();
  return db.count(HOA_STORE);
}

// ==========================================
// CONTRIBUTIONS CRUD Operations
// ==========================================

// Create - Add a new contribution
export async function addContribution(contributionData) {
  const db = await initDB();
  const contribution = {
    ...contributionData,
    paymentStatus: contributionData.paymentStatus || 'pending',
    receiptDelivered: contributionData.receiptDelivered || false,
    createdAt: new Date().toISOString(),
  };
  return db.add(CONTRIBUTIONS_STORE, contribution);
}

// Read - Get all contributions for a specific HOA
export async function getContributionsByHOA(hoaId) {
  const db = await initDB();
  return db.getAllFromIndex(CONTRIBUTIONS_STORE, 'hoaId', hoaId);
}

// Read - Get contribution by ID
export async function getContributionById(id) {
  const db = await initDB();
  return db.get(CONTRIBUTIONS_STORE, id);
}

// Update - Update an existing contribution
export async function updateContribution(id, updates) {
  const db = await initDB();
  const contribution = await db.get(CONTRIBUTIONS_STORE, id);
  if (!contribution) {
    throw new Error(`Contribution with id ${id} not found`);
  }
  const updatedContribution = {
    ...contribution,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return db.put(CONTRIBUTIONS_STORE, updatedContribution);
}

// Delete - Remove a contribution by ID
export async function deleteContribution(id) {
  const db = await initDB();
  return db.delete(CONTRIBUTIONS_STORE, id);
}

// Delete - Clear all contributions for a specific HOA
export async function clearContributionsByHOA(hoaId) {
  const db = await initDB();
  const contributions = await getContributionsByHOA(hoaId);
  const tx = db.transaction(CONTRIBUTIONS_STORE, 'readwrite');
  await Promise.all(contributions.map(c => tx.store.delete(c.id)));
  await tx.done;
}

// ==========================================
// EXPENSES CRUD Operations
// ==========================================

// Create - Add a new expense
export async function addExpense(expenseData) {
  const db = await initDB();
  const expense = {
    ...expenseData,
    paymentStatus: expenseData.paymentStatus || 'pending',
    createdAt: new Date().toISOString(),
  };
  return db.add(EXPENSES_STORE, expense);
}

// Read - Get all expenses for a specific HOA
export async function getExpensesByHOA(hoaId) {
  const db = await initDB();
  return db.getAllFromIndex(EXPENSES_STORE, 'hoaId', hoaId);
}

// Read - Get expense by ID
export async function getExpenseById(id) {
  const db = await initDB();
  return db.get(EXPENSES_STORE, id);
}

// Update - Update an existing expense
export async function updateExpense(id, updates) {
  const db = await initDB();
  const expense = await db.get(EXPENSES_STORE, id);
  if (!expense) {
    throw new Error(`Expense with id ${id} not found`);
  }
  const updatedExpense = {
    ...expense,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return db.put(EXPENSES_STORE, updatedExpense);
}

// Delete - Remove an expense by ID
export async function deleteExpense(id) {
  const db = await initDB();
  return db.delete(EXPENSES_STORE, id);
}

// Delete - Clear all expenses for a specific HOA
export async function clearExpensesByHOA(hoaId) {
  const db = await initDB();
  const expenses = await getExpensesByHOA(hoaId);
  const tx = db.transaction(EXPENSES_STORE, 'readwrite');
  await Promise.all(expenses.map(e => tx.store.delete(e.id)));
  await tx.done;
}

// ==========================================
// BULK OPERATIONS
// ==========================================

// Bulk update payment status for contributions and expenses
export async function bulkUpdatePaymentStatus(contributionIds, expenseIds, status) {
  const db = await initDB();
  const updates = [];

  // Update contributions
  if (contributionIds.length > 0) {
    const contributionUpdates = contributionIds.map(async (id) => {
      const contribution = await db.get(CONTRIBUTIONS_STORE, id);
      if (contribution) {
        return db.put(CONTRIBUTIONS_STORE, {
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
      const expense = await db.get(EXPENSES_STORE, id);
      if (expense) {
        return db.put(EXPENSES_STORE, {
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

// Bulk update receipt delivered status for contributions
export async function bulkUpdateReceiptStatus(contributionIds, delivered) {
  const db = await initDB();

  const updates = contributionIds.map(async (id) => {
    const contribution = await db.get(CONTRIBUTIONS_STORE, id);
    if (contribution) {
      return db.put(CONTRIBUTIONS_STORE, {
        ...contribution,
        receiptDelivered: delivered,
        updatedAt: new Date().toISOString(),
      });
    }
  });

  await Promise.all(updates);
}

// ==========================================
// FINANCIAL CALCULATIONS
// ==========================================

// Calculate total contributions for a specific HOA
export async function getTotalContributions(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.reduce((total, contribution) => total + contribution.amount, 0);
}

// Calculate total expenses for a specific HOA
export async function getTotalExpenses(hoaId) {
  const expenses = await getExpensesByHOA(hoaId);
  return expenses.reduce((total, expense) => total + expense.amount, 0);
}

// Calculate net balance (contributions - expenses) for a specific HOA
export async function getNetBalance(hoaId) {
  const totalContributions = await getTotalContributions(hoaId);
  const totalExpenses = await getTotalExpenses(hoaId);
  return totalContributions - totalExpenses;
}

// Get financial summary for a specific HOA
export async function getFinancialSummary(hoaId) {
  const [totalContributions, totalExpenses, contributions, expenses] = await Promise.all([
    getTotalContributions(hoaId),
    getTotalExpenses(hoaId),
    getContributionsByHOA(hoaId),
    getExpensesByHOA(hoaId),
  ]);

  return {
    totalContributions,
    totalExpenses,
    netBalance: totalContributions - totalExpenses,
    contributionsCount: contributions.length,
    expensesCount: expenses.length,
  };
}

// ==========================================
// UNIFIED TRANSACTIONS
// ==========================================

// Get all transactions (contributions + expenses) for a specific HOA, sorted by date
export async function getAllTransactions(hoaId) {
  const [contributions, expenses] = await Promise.all([
    getContributionsByHOA(hoaId),
    getExpensesByHOA(hoaId),
  ]);

  // Add transactionType field to differentiate between contributions and expenses
  const contributionsWithType = contributions.map(c => ({
    ...c,
    transactionType: 'contribution',
    // Ensure status fields have defaults for existing records
    paymentStatus: c.paymentStatus || 'pending',
    receiptDelivered: c.receiptDelivered || false,
  }));

  const expensesWithType = expenses.map(e => ({
    ...e,
    transactionType: 'expense',
    // Ensure status field has default for existing records
    paymentStatus: e.paymentStatus || 'pending',
  }));

  // Combine and sort by createdAt (newest first)
  return [...contributionsWithType, ...expensesWithType]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Delete all transactions (contributions + expenses) for a specific HOA
export async function clearAllTransactions(hoaId) {
  await Promise.all([
    clearContributionsByHOA(hoaId),
    clearExpensesByHOA(hoaId),
  ]);
}

// ==========================================
// APP RESET
// ==========================================

// Delete all data from all stores (complete app reset)
export async function clearAllData() {
  const db = await initDB();
  await Promise.all([
    db.clear(HOA_STORE),
    db.clear(CONTRIBUTIONS_STORE),
    db.clear(EXPENSES_STORE),
  ]);
}
