/**
 * Contributions CRUD Operations & Rate Management
 * Handles all contribution-related database operations including rate history
 */

import { initDB } from './init';
import { getHOAById, updateHOA } from './hoa';
import { STORES, CONTRIBUTION_TYPE, PAYMENT_STATUS, RECEIPT_STATUS, ERROR_MESSAGES } from './constants';

// ==========================================
// CONTRIBUTION CRUD OPERATIONS
// ==========================================

/**
 * Add a new contribution
 * @param {Object} contributionData - Contribution data
 * @returns {Promise<number>} ID of the created contribution
 */
export async function addContribution(contributionData) {
  const db = await initDB();
  const contribution = {
    ...contributionData,
    contributionType: contributionData.contributionType || CONTRIBUTION_TYPE.REGULAR,
    purpose: contributionData.purpose || null,
    paymentStatus: contributionData.paymentStatus || PAYMENT_STATUS.PENDING,
    receiptDelivered: contributionData.receiptDelivered || false,
    receiptStatus: contributionData.receiptStatus || RECEIPT_STATUS.NOT_PRINTED,
    createdAt: new Date().toISOString(),
  };
  return db.add(STORES.CONTRIBUTIONS, contribution);
}

/**
 * Get all contributions for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Array of contributions
 */
export async function getContributionsByHOA(hoaId) {
  const db = await initDB();
  return db.getAllFromIndex(STORES.CONTRIBUTIONS, 'hoaId', hoaId);
}

/**
 * Get contribution by ID
 * @param {number} id - Contribution ID
 * @returns {Promise<Object>} The contribution object
 */
export async function getContributionById(id) {
  const db = await initDB();
  return db.get(STORES.CONTRIBUTIONS, id);
}

/**
 * Update an existing contribution
 * @param {number} id - Contribution ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<number>} The contribution ID
 */
export async function updateContribution(id, updates) {
  const db = await initDB();
  const contribution = await db.get(STORES.CONTRIBUTIONS, id);
  if (!contribution) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND('Contribution', id));
  }
  const updatedContribution = {
    ...contribution,
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  return db.put(STORES.CONTRIBUTIONS, updatedContribution);
}

/**
 * Delete a contribution by ID
 * @param {number} id - Contribution ID
 * @returns {Promise<void>}
 */
export async function deleteContribution(id) {
  const db = await initDB();
  return db.delete(STORES.CONTRIBUTIONS, id);
}

/**
 * Clear all contributions for a specific HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<void>}
 */
export async function clearContributionsByHOA(hoaId) {
  const db = await initDB();
  const contributions = await getContributionsByHOA(hoaId);
  const tx = db.transaction(STORES.CONTRIBUTIONS, 'readwrite');
  await Promise.all(contributions.map(c => tx.store.delete(c.id)));
  await tx.done;
}

// ==========================================
// SPECIAL ASSESSMENTS
// ==========================================

/**
 * Add a special assessment for a single unit
 * @param {Object} assessmentData - Assessment data
 * @returns {Promise<number>} ID of the created assessment
 */
export async function addSpecialAssessment(assessmentData) {
  const { hoaId, unitNumber, purpose, amount, dueDate, notes } = assessmentData;

  return addContribution({
    hoaId,
    unitNumber,
    contributionType: CONTRIBUTION_TYPE.SPECIAL,
    purpose,
    amount,
    startMonth: dueDate || new Date().toISOString().slice(0, 7),
    paymentStatus: PAYMENT_STATUS.PENDING,
    receiptDelivered: false,
    notes: notes || null,
  });
}

/**
 * Add a special assessment for multiple units (bulk)
 * @param {Object} assessmentData - Assessment data with unitNumbers array
 * @returns {Promise<Array>} Array of created assessment IDs
 */
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

/**
 * Get all special assessments for a HOA
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Array of special assessments
 */
export async function getSpecialAssessments(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.filter(c => c.contributionType === CONTRIBUTION_TYPE.SPECIAL);
}

/**
 * Get special assessments grouped by purpose
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Array of grouped assessments with statistics
 */
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

    if (assessment.paymentStatus === PAYMENT_STATUS.PAID) {
      grouped[purpose].paidAmount += assessment.amount;
      grouped[purpose].paidCount += 1;
    } else {
      grouped[purpose].pendingAmount += assessment.amount;
      grouped[purpose].pendingCount += 1;
    }
  });

  return Object.values(grouped);
}

/**
 * Get regular contributions only (excludes special assessments)
 * @param {number} hoaId - HOA ID
 * @returns {Promise<Array>} Array of regular contributions
 */
export async function getRegularContributions(hoaId) {
  const contributions = await getContributionsByHOA(hoaId);
  return contributions.filter(c => !c.contributionType || c.contributionType === CONTRIBUTION_TYPE.REGULAR);
}

// ==========================================
// CONTRIBUTION RATE HISTORY MANAGEMENT
// ==========================================

/**
 * Get rate for a specific month (YYYY-MM format)
 * @param {Object} hoa - HOA object with rate history
 * @param {string} yearMonth - YYYY-MM format
 * @returns {number} The applicable rate
 */
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

/**
 * Calculate contribution amount with rate breakdown for a date range
 * @param {Object} hoa - HOA object with rate history
 * @param {Array} monthsRange - Array of {year, month} objects
 * @returns {Object} Object with totalAmount, breakdown, and hasMultipleRates
 */
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

/**
 * Add a new contribution rate change
 * @param {number} hoaId - HOA ID
 * @param {Object} rateChange - Rate change data {effectiveDate, amount, note}
 * @returns {Promise<Object>} Updated HOA object
 */
export async function addContributionRateChange(hoaId, rateChange) {
  const hoa = await getHOAById(hoaId);
  if (!hoa) {
    throw new Error(ERROR_MESSAGES.NOT_FOUND('HOA', hoaId));
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
    throw new Error(ERROR_MESSAGES.DUPLICATE_RATE_DATE(rateChange.effectiveDate));
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

  await updateHOA(hoaId, {
    contributionRateHistory: hoa.contributionRateHistory,
    monthlyContribution: hoa.monthlyContribution
  });

  return hoa;
}

/**
 * Update an existing rate change
 * @param {number} hoaId - HOA ID
 * @param {string} oldEffectiveDate - The current effective date to update
 * @param {Object} updates - New values for the rate change
 * @returns {Promise<Object>} Updated HOA object
 */
export async function updateContributionRateChange(hoaId, oldEffectiveDate, updates) {
  const hoa = await getHOAById(hoaId);
  if (!hoa || !hoa.contributionRateHistory) {
    throw new Error(ERROR_MESSAGES.RATE_HISTORY_NOT_FOUND);
  }

  const index = hoa.contributionRateHistory.findIndex(
    r => r.effectiveDate === oldEffectiveDate
  );

  if (index === -1) {
    throw new Error('Rate change not found');
  }

  // Prevent changing the first entry's effective date (it's locked to HOA creation)
  if (index === 0 && updates.effectiveDate) {
    throw new Error(ERROR_MESSAGES.CANNOT_CHANGE_INITIAL_DATE);
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

  await updateHOA(hoaId, {
    contributionRateHistory: hoa.contributionRateHistory,
    monthlyContribution: hoa.monthlyContribution
  });

  return hoa;
}

/**
 * Delete a rate change
 * @param {number} hoaId - HOA ID
 * @param {string} effectiveDate - The effective date of the rate to delete
 * @returns {Promise<Object>} Updated HOA object
 */
export async function deleteContributionRateChange(hoaId, effectiveDate) {
  const hoa = await getHOAById(hoaId);
  if (!hoa || !hoa.contributionRateHistory) {
    throw new Error(ERROR_MESSAGES.RATE_HISTORY_NOT_FOUND);
  }

  // Don't allow deleting the first entry
  if (hoa.contributionRateHistory[0]?.effectiveDate === effectiveDate) {
    throw new Error(ERROR_MESSAGES.CANNOT_DELETE_INITIAL_RATE);
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

  await updateHOA(hoaId, {
    contributionRateHistory: hoa.contributionRateHistory,
    monthlyContribution: hoa.monthlyContribution
  });

  return hoa;
}
