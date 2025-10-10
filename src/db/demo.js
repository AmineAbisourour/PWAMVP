/**
 * Demo Data Module
 * Handles loading and clearing demo data
 */

import { createHOA, getAllHOAs, deleteHOA } from './hoa';
import { addContribution, addBulkSpecialAssessment, updateContribution } from './contributions';
import { addExpense } from './expenses';
import { clearAllTransactions } from './transactions';

/**
 * Load demo data for users to explore the app
 * @returns {Promise<number>} ID of the created demo HOA
 */
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

  // Add contributions
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
  const facadeContributions = await import('./contributions').then(m => m.getContributionsByHOA(hoaId));
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
  const roofContributions = await import('./contributions').then(m => m.getContributionsByHOA(hoaId));
  const roofAssessments = roofContributions.filter(c =>
    c.contributionType === 'special' && c.purpose === 'Emergency Roof Repair'
  );
  // Mark 42 out of 50 as paid
  for (let i = 0; i < Math.min(42, roofAssessments.length); i++) {
    await updateContribution(roofAssessments[i].id, { paymentStatus: 'paid' });
  }

  return hoaId;
}

/**
 * Clear demo data and return to fresh state
 * @returns {Promise<void>}
 */
export async function clearDemoData() {
  const hoas = await getAllHOAs();
  const demoHOAs = hoas.filter(hoa => hoa.isDemo === true);

  for (const hoa of demoHOAs) {
    await clearAllTransactions(hoa.id);
    await deleteHOA(hoa.id);
  }
}

/**
 * Delete all data from all stores (complete app reset)
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  const { initDB } = await import('./init');
  const { STORES } = await import('./constants');
  const db = await initDB();

  await Promise.all([
    db.clear(STORES.HOA),
    db.clear(STORES.CONTRIBUTIONS),
    db.clear(STORES.EXPENSES),
  ]);
}
