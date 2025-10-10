/**
 * Database Constants and Enums
 * Central location for all database-related constants
 */

// Database Configuration
export const DB_NAME = 'HOA_PWA_DB';
export const DB_VERSION = 4;

// Object Store Names
export const STORES = {
  HOA: 'hoas',
  CONTRIBUTIONS: 'contributions',
  EXPENSES: 'expenses',
};

// Payment Status Enum
export const PAYMENT_STATUS = {
  PAID: 'paid',
  PENDING: 'pending',
};

// Contribution Type Enum
export const CONTRIBUTION_TYPE = {
  REGULAR: 'regular',
  SPECIAL: 'special',
  OPENING: 'opening', // Legacy, no longer used (stored in HOA record)
};

// Receipt Status Enum (for workflow tracking)
export const RECEIPT_STATUS = {
  NOT_PRINTED: 'not_printed',
  PRINTED: 'printed',
  WITH_CONCIERGE: 'with_concierge',
  DELIVERED: 'delivered',
};

// Expense Type Categories
export const EXPENSE_TYPES = [
  'Landscaping',
  'Utilities',
  'Maintenance',
  'Insurance',
  'Repairs',
  'Security',
  'Administrative',
  'Legal',
  'Other',
];

// Collection Rate Modes
export const COLLECTION_RATE_MODE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
  OVERALL: 'overall',
};

// Transaction Types (for unified view)
export const TRANSACTION_TYPE = {
  CONTRIBUTION: 'contribution',
  EXPENSE: 'expense',
};

// Error Messages
export const ERROR_MESSAGES = {
  NOT_FOUND: (type, id) => `${type} with id ${id} not found`,
  DUPLICATE_RATE_DATE: (date) => `A rate change already exists for ${date}`,
  CANNOT_DELETE_INITIAL_RATE: 'Cannot delete initial rate',
  CANNOT_CHANGE_INITIAL_DATE: 'Cannot change effective date of initial rate',
  RATE_HISTORY_NOT_FOUND: 'Rate history not found',
};
