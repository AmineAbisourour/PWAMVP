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
    country: 'MA', // Default country (Morocco)
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
    contributionType: contributionData.contributionType || 'regular', // 'regular', 'special', 'opening'
    purpose: contributionData.purpose || null, // Purpose/description for special assessments
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
// SPECIAL ASSESSMENTS
// ==========================================

// Add a special assessment for a single unit
export async function addSpecialAssessment(assessmentData) {
  const { hoaId, unitNumber, purpose, amount, dueDate, notes } = assessmentData;

  return addContribution({
    hoaId,
    unitNumber,
    contributionType: 'special',
    purpose,
    amount,
    startMonth: dueDate || new Date().toISOString().slice(0, 7),
    paymentStatus: 'pending',
    receiptDelivered: false,
    notes: notes || null,
  });
}

// Add a special assessment for multiple units (bulk)
export async function addBulkSpecialAssessment(assessmentData) {
  const { hoaId, unitNumbers, purpose, amountPerUnit, dueDate, notes } = assessmentData;

  const promises = unitNumbers.map(unitNumber =>
    addSpecialAssessment({
      hoaId,
      unitNumber,
      purpose,
      amount: amountPerUnit,
      dueDate,
      notes,
    })
  );

  return Promise.all(promises);
}

// Note: Opening balance is now stored as a property of the HOA record (hoa.openingBalance)
// This function has been removed as opening balance is no longer a contribution

// Get all special assessments for a HOA
export async function getSpecialAssessments(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.filter(c => c.contributionType === 'special');
}

// Get special assessments grouped by purpose
export async function getSpecialAssessmentsByPurpose(hoaId) {
  const specialAssessments = await getSpecialAssessments(hoaId);

  const grouped = {};
  specialAssessments.forEach(assessment => {
    const purpose = assessment.purpose || 'Unnamed Assessment';
    if (!grouped[purpose]) {
      grouped[purpose] = {
        purpose,
        assessments: [],
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        totalCount: 0,
        paidCount: 0,
        pendingCount: 0,
      };
    }

    grouped[purpose].assessments.push(assessment);
    grouped[purpose].totalAmount += assessment.amount;
    grouped[purpose].totalCount += 1;

    if (assessment.paymentStatus === 'paid') {
      grouped[purpose].paidAmount += assessment.amount;
      grouped[purpose].paidCount += 1;
    } else {
      grouped[purpose].pendingAmount += assessment.amount;
      grouped[purpose].pendingCount += 1;
    }
  });

  return Object.values(grouped);
}

// Get regular contributions only
export async function getRegularContributions(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.filter(c => !c.contributionType || c.contributionType === 'regular');
}

// Get opening balance for a HOA
export async function getOpeningBalance(hoaId) {
  const hoa = await getHOAById(hoaId);
  return hoa?.openingBalance || 0;
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

// Get financial summary with breakdown by contribution type
// This is the single source of truth for all financial calculations
export async function getFinancialSummary(hoaId) {
  const [hoa, contributions, expenses] = await Promise.all([
    getHOAById(hoaId),
    getContributionsByHOA(hoaId),
    getExpensesByHOA(hoaId),
  ]);

  // Separate contributions by type
  const regularContributions = contributions.filter(c => !c.contributionType || c.contributionType === 'regular');
  const specialAssessments = contributions.filter(c => c.contributionType === 'special');

  const regularTotal = regularContributions.reduce((sum, c) => sum + c.amount, 0);
  const specialTotal = specialAssessments.reduce((sum, c) => sum + c.amount, 0);
  const openingBalanceAmount = hoa?.openingBalance || 0;
  const totalContributions = regularTotal + specialTotal + openingBalanceAmount;
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  return {
    // Totals
    totalContributions,
    totalExpenses,
    netBalance: totalContributions - totalExpenses,

    // Breakdown
    regularContributions: regularTotal,
    specialAssessments: specialTotal,
    openingBalance: openingBalanceAmount,

    // Counts
    regularContributionsCount: regularContributions.length,
    specialAssessmentsCount: specialAssessments.length,
    expensesCount: expenses.length,

    // Detailed arrays
    contributions,
    expenses,
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

  // Filter out old opening balance contributions (for backward compatibility)
  // Opening balance is now stored as a property of the HOA record
  const filteredContributions = contributions.filter(c => c.contributionType !== 'opening');

  // Add transactionType field to differentiate between contributions and expenses
  const contributionsWithType = filteredContributions.map(c => ({
    ...c,
    transactionType: 'contribution',
    // Ensure status fields have defaults for existing records
    paymentStatus: c.paymentStatus || 'pending',
    receiptDelivered: c.receiptDelivered || false,
    contributionType: c.contributionType || 'regular', // Default to regular for backward compatibility
    purpose: c.purpose || null,
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

// ==========================================
// DEMO MODE
// ==========================================

// Load demo data for users to explore the app
export async function loadDemoData() {
  // Create demo HOA
  const hoaId = await createHOA({
    name: 'Sunset Valley HOA',
    address: '123 Valley View Drive, Sunset City, CA 94000',
    numberOfUnits: 50,
    monthlyContribution: 250,
    country: 'MA',
    isDemo: true,
  });

  // Get dates for demo data (last 3 months)
  const now = new Date();
  const months = [
    new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().slice(0, 7), // 2 months ago
    new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7), // 1 month ago
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 7),     // current month
  ];

  // Sample contributions (12 contributions)
  const contributions = [
    { unitNumber: 12, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: true },
    { unitNumber: 7, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: true },
    { unitNumber: 23, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: false },
    { unitNumber: 45, startMonth: months[1], amount: 250, paymentStatus: 'paid', receiptDelivered: true },
    { unitNumber: 8, startMonth: months[1], amount: 250, paymentStatus: 'paid', receiptDelivered: true },
    { unitNumber: 15, startMonth: months[1], amount: 500, paymentStatus: 'paid', receiptDelivered: false, endMonth: months[2] },
    { unitNumber: 34, startMonth: months[1], amount: 250, paymentStatus: 'pending', receiptDelivered: false },
    { unitNumber: 19, startMonth: months[2], amount: 250, paymentStatus: 'paid', receiptDelivered: true },
    { unitNumber: 42, startMonth: months[2], amount: 250, paymentStatus: 'paid', receiptDelivered: false },
    { unitNumber: 5, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false },
    { unitNumber: 28, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false },
    { unitNumber: 31, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false },
  ];

  // Sample expenses (8 expenses)
  const expenses = [
    { type: 'Landscaping', description: 'Monthly garden maintenance and lawn care', amount: 850, paymentStatus: 'paid' },
    { type: 'Utilities', description: 'Common area electricity and water bill', amount: 420, paymentStatus: 'paid' },
    { type: 'Maintenance', description: 'Pool cleaning and chemical treatment', amount: 350, paymentStatus: 'paid' },
    { type: 'Insurance', description: 'Monthly HOA liability insurance premium', amount: 675, paymentStatus: 'paid' },
    { type: 'Repairs', description: 'Front gate motor replacement', amount: 1250, paymentStatus: 'paid' },
    { type: 'Security', description: 'Security patrol services for the month', amount: 800, paymentStatus: 'paid' },
    { type: 'Maintenance', description: 'Elevator inspection and servicing', amount: 550, paymentStatus: 'pending' },
    { type: 'Utilities', description: 'Internet service for common areas', amount: 120, paymentStatus: 'pending' },
  ];

  // Add contributions with slight time delays to create realistic timestamps
  for (let i = 0; i < contributions.length; i++) {
    await addContribution({
      hoaId,
      ...contributions[i],
    });
  }

  // Add expenses
  for (let i = 0; i < expenses.length; i++) {
    await addExpense({
      hoaId,
      ...expenses[i],
    });
  }

  // Add special assessments for two projects
  // 1. Facade Repainting - for units 1-20
  await addBulkSpecialAssessment({
    hoaId,
    unitNumbers: Array.from({ length: 20 }, (_, i) => i + 1),
    purpose: 'Building Facade Repainting',
    amountPerUnit: 450,
    dueDate: months[2],
    notes: 'Special assessment for exterior facade renovation project',
  });

  // Mark some units as paid for realism
  const facadeContributions = await getContributionsByHOA(hoaId);
  const facadeAssessments = facadeContributions.filter(c =>
    c.contributionType === 'special' && c.purpose === 'Building Facade Repainting'
  );
  // Mark first 12 units as paid
  for (let i = 0; i < Math.min(12, facadeAssessments.length); i++) {
    await updateContribution(facadeAssessments[i].id, { paymentStatus: 'paid' });
  }

  // 2. Emergency Roof Repair - for all units
  await addBulkSpecialAssessment({
    hoaId,
    unitNumbers: Array.from({ length: 50 }, (_, i) => i + 1),
    purpose: 'Emergency Roof Repair',
    amountPerUnit: 180,
    dueDate: months[1],
    notes: 'Urgent repairs needed after storm damage',
  });

  // Mark most units as paid for this older assessment
  const roofContributions = await getContributionsByHOA(hoaId);
  const roofAssessments = roofContributions.filter(c =>
    c.contributionType === 'special' && c.purpose === 'Emergency Roof Repair'
  );
  // Mark 42 out of 50 as paid
  for (let i = 0; i < Math.min(42, roofAssessments.length); i++) {
    await updateContribution(roofAssessments[i].id, { paymentStatus: 'paid' });
  }

  return hoaId;
}

// Clear demo data and return to fresh state
export async function clearDemoData() {
  const hoas = await getAllHOAs();
  const demoHOAs = hoas.filter(hoa => hoa.isDemo === true);

  for (const hoa of demoHOAs) {
    await clearAllTransactions(hoa.id);
    await deleteHOA(hoa.id);
  }
}
