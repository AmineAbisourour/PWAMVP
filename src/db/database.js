import { openDB } from 'idb';

const DB_NAME = 'HOA_PWA_DB';
const DB_VERSION = 4; // Updated for contribution rate history
const HOA_STORE = 'hoas';
const CONTRIBUTIONS_STORE = 'contributions';
const EXPENSES_STORE = 'expenses';

// Initialize the database
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
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

      // Version 3: Add receiptStatus field to existing contributions
      if (oldVersion < 3 && db.objectStoreNames.contains(CONTRIBUTIONS_STORE)) {
        const contributionsStore = transaction.objectStore(CONTRIBUTIONS_STORE);
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
      if (oldVersion < 4 && db.objectStoreNames.contains(HOA_STORE)) {
        const hoaStore = transaction.objectStore(HOA_STORE);
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
// CONTRIBUTION RATE HISTORY MANAGEMENT
// ==========================================

// Get rate for a specific month (YYYY-MM format)
export function getRateForMonth(hoa, yearMonth) {
  if (!hoa.contributionRateHistory || hoa.contributionRateHistory.length === 0) {
    return hoa.monthlyContribution; // Fallback to current rate
  }

  // Find applicable rate (most recent rate before or on the month)
  const applicableRates = hoa.contributionRateHistory
    .filter(rate => rate.effectiveDate <= yearMonth)
    .sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  return applicableRates[0]?.amount || hoa.monthlyContribution;
}

// Calculate contribution amount with rate breakdown for a date range
export function calculateContributionAmount(hoa, monthsRange) {
  let totalAmount = 0;
  const breakdown = [];
  let currentRate = null;
  let currentRangeStart = null;
  let currentRangeCount = 0;

  // Process each month in the range
  for (let i = 0; i < monthsRange.length; i++) {
    const month = monthsRange[i];
    const yearMonth = `${month.year}-${String(month.month + 1).padStart(2, '0')}`;
    const rateForMonth = getRateForMonth(hoa, yearMonth);

    if (currentRate === rateForMonth) {
      // Same rate, continue current range
      currentRangeCount++;
    } else {
      // Rate changed, save previous range if exists
      if (currentRate !== null) {
        breakdown.push({
          startMonth: currentRangeStart,
          endMonth: monthsRange[i - 1],
          rate: currentRate,
          count: currentRangeCount,
          subtotal: currentRate * currentRangeCount
        });
      }
      // Start new range
      currentRate = rateForMonth;
      currentRangeStart = month;
      currentRangeCount = 1;
    }

    totalAmount += rateForMonth;
  }

  // Add final range
  if (currentRate !== null) {
    breakdown.push({
      startMonth: currentRangeStart,
      endMonth: monthsRange[monthsRange.length - 1],
      rate: currentRate,
      count: currentRangeCount,
      subtotal: currentRate * currentRangeCount
    });
  }

  return {
    totalAmount,
    breakdown,
    hasMultipleRates: breakdown.length > 1
  };
}

// Add a new contribution rate change
export async function addContributionRateChange(hoaId, rateChange) {
  const db = await initDB();
  const hoa = await db.get(HOA_STORE, hoaId);

  if (!hoa) {
    throw new Error(`HOA with id ${hoaId} not found`);
  }

  // Initialize rate history if it doesn't exist
  if (!hoa.contributionRateHistory) {
    hoa.contributionRateHistory = [];
  }

  // Validate: no duplicate effective dates
  const existingDate = hoa.contributionRateHistory.find(
    r => r.effectiveDate === rateChange.effectiveDate
  );
  if (existingDate) {
    throw new Error(`A rate change already exists for ${rateChange.effectiveDate}`);
  }

  // Add new rate
  hoa.contributionRateHistory.push({
    effectiveDate: rateChange.effectiveDate,
    amount: rateChange.amount,
    note: rateChange.note || '',
    createdAt: new Date().toISOString()
  });

  // Sort by effective date
  hoa.contributionRateHistory.sort((a, b) =>
    a.effectiveDate.localeCompare(b.effectiveDate)
  );

  // Update current rate to most recent
  const mostRecent = hoa.contributionRateHistory[hoa.contributionRateHistory.length - 1];
  hoa.monthlyContribution = mostRecent.amount;

  hoa.updatedAt = new Date().toISOString();

  await db.put(HOA_STORE, hoa);
  return hoa;
}

// Update an existing rate change
export async function updateContributionRateChange(hoaId, oldEffectiveDate, updates) {
  const db = await initDB();
  const hoa = await db.get(HOA_STORE, hoaId);

  if (!hoa || !hoa.contributionRateHistory) {
    throw new Error('Rate history not found');
  }

  const index = hoa.contributionRateHistory.findIndex(
    r => r.effectiveDate === oldEffectiveDate
  );

  if (index === -1) {
    throw new Error('Rate change not found');
  }

  // Prevent changing the first entry's effective date (it's locked to HOA creation)
  if (index === 0 && updates.effectiveDate) {
    throw new Error('Cannot change effective date of initial rate');
  }

  // Update the rate
  hoa.contributionRateHistory[index] = {
    ...hoa.contributionRateHistory[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  // Re-sort if effective date changed
  if (updates.effectiveDate) {
    hoa.contributionRateHistory.sort((a, b) =>
      a.effectiveDate.localeCompare(b.effectiveDate)
    );
  }

  // Update current rate if this was the most recent
  const mostRecent = hoa.contributionRateHistory[hoa.contributionRateHistory.length - 1];
  hoa.monthlyContribution = mostRecent.amount;

  hoa.updatedAt = new Date().toISOString();

  await db.put(HOA_STORE, hoa);
  return hoa;
}

// Delete a rate change
export async function deleteContributionRateChange(hoaId, effectiveDate) {
  const db = await initDB();
  const hoa = await db.get(HOA_STORE, hoaId);

  if (!hoa || !hoa.contributionRateHistory) {
    throw new Error('Rate history not found');
  }

  // Don't allow deleting the first entry
  if (hoa.contributionRateHistory[0]?.effectiveDate === effectiveDate) {
    throw new Error('Cannot delete initial rate');
  }

  // Remove the rate
  hoa.contributionRateHistory = hoa.contributionRateHistory.filter(
    r => r.effectiveDate !== effectiveDate
  );

  // Update current rate to most recent
  if (hoa.contributionRateHistory.length > 0) {
    const mostRecent = hoa.contributionRateHistory[hoa.contributionRateHistory.length - 1];
    hoa.monthlyContribution = mostRecent.amount;
  }

  hoa.updatedAt = new Date().toISOString();

  await db.put(HOA_STORE, hoa);
  return hoa;
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
    receiptStatus: contributionData.receiptStatus || 'not_printed', // 'not_printed', 'printed', 'with_concierge', 'delivered'
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

// Bulk update receipt workflow status for contributions
export async function bulkUpdateReceiptWorkflowStatus(contributionIds, receiptStatus) {
  const db = await initDB();

  const updates = contributionIds.map(async (id) => {
    const contribution = await db.get(CONTRIBUTIONS_STORE, id);
    if (contribution) {
      const updates = {
        receiptStatus,
        updatedAt: new Date().toISOString(),
      };

      // Auto-update receiptDelivered when status is 'delivered'
      if (receiptStatus === 'delivered') {
        updates.receiptDelivered = true;
      }

      return db.put(CONTRIBUTIONS_STORE, {
        ...contribution,
        ...updates,
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

  // Separate by payment status for accurate cash position tracking
  const paidContributions = contributions
    .filter(c => c.paymentStatus === 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const pendingContributions = contributions
    .filter(c => c.paymentStatus !== 'paid')
    .reduce((sum, c) => sum + c.amount, 0);

  const paidExpenses = expenses
    .filter(e => e.paymentStatus === 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  const pendingExpenses = expenses
    .filter(e => e.paymentStatus !== 'paid')
    .reduce((sum, e) => sum + e.amount, 0);

  // Net Balance now reflects actual cash position (paid transactions only)
  const netBalance = (paidContributions + openingBalanceAmount) - paidExpenses;

  // Projected Balance includes pending transactions
  // Note: totalContributions already includes openingBalanceAmount, so don't add it again
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
    paidContributionsCount: contributions.filter(c => c.paymentStatus === 'paid').length,
    pendingContributionsCount: contributions.filter(c => c.paymentStatus !== 'paid').length,
    paidExpensesCount: expenses.filter(e => e.paymentStatus === 'paid').length,
    pendingExpensesCount: expenses.filter(e => e.paymentStatus !== 'paid').length,

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
    receiptStatus: c.receiptStatus || 'not_printed', // Default to not_printed for backward compatibility
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

  // Sample contributions (12 contributions) with different workflow states
  const contributions = [
    { unitNumber: 12, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: true, receiptStatus: 'delivered' },
    { unitNumber: 7, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: true, receiptStatus: 'delivered' },
    { unitNumber: 23, startMonth: months[0], amount: 250, paymentStatus: 'paid', receiptDelivered: false, receiptStatus: 'with_concierge' },
    { unitNumber: 45, startMonth: months[1], amount: 250, paymentStatus: 'paid', receiptDelivered: true, receiptStatus: 'delivered' },
    { unitNumber: 8, startMonth: months[1], amount: 250, paymentStatus: 'paid', receiptDelivered: true, receiptStatus: 'delivered' },
    { unitNumber: 15, startMonth: months[1], amount: 500, paymentStatus: 'paid', receiptDelivered: false, receiptStatus: 'with_concierge', endMonth: months[2] },
    { unitNumber: 34, startMonth: months[1], amount: 250, paymentStatus: 'pending', receiptDelivered: false, receiptStatus: 'with_concierge' },
    { unitNumber: 19, startMonth: months[2], amount: 250, paymentStatus: 'paid', receiptDelivered: true, receiptStatus: 'delivered' },
    { unitNumber: 42, startMonth: months[2], amount: 250, paymentStatus: 'paid', receiptDelivered: false, receiptStatus: 'printed' },
    { unitNumber: 5, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false, receiptStatus: 'with_concierge' },
    { unitNumber: 28, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false, receiptStatus: 'printed' },
    { unitNumber: 31, startMonth: months[2], amount: 250, paymentStatus: 'pending', receiptDelivered: false, receiptStatus: 'not_printed' },
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
