import { useState, useEffect, useCallback } from 'react';
import { getAllTransactions } from '../db/transactions';
import { getContributionsByHOA, addContribution, updateContribution, deleteContribution } from '../db/contributions';
import { getExpensesByHOA, addExpense, updateExpense, deleteExpense } from '../db/expenses';
import { getFinancialSummary } from '../db/financials';

/**
 * Unified hook for managing all transaction operations
 * Provides consistent interface for contributions and expenses
 */
export function useTransactions(hoaId) {
  const [transactions, setTransactions] = useState([]);
  const [contributions, setContributions] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [financialSummary, setFinancialSummary] = useState({
    totalContributions: 0,
    totalExpenses: 0,
    netBalance: 0,
    contributionsCount: 0,
    expensesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load all transaction data
  const loadTransactions = useCallback(async () => {
    if (!hoaId) return;

    try {
      setLoading(true);
      setError(null);

      const [allTrans, contribs, exps, summary] = await Promise.all([
        getAllTransactions(hoaId),
        getContributionsByHOA(hoaId),
        getExpensesByHOA(hoaId),
        getFinancialSummary(hoaId),
      ]);

      // All transactions are already sorted by getAllTransactions
      setTransactions(allTrans);

      // Sort contributions and expenses separately
      setContributions(contribs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setExpenses(exps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setFinancialSummary(summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hoaId]);

  // Load on mount and when hoaId changes
  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  // Add a new contribution
  const addNewContribution = useCallback(
    async (contributionData) => {
      try {
        setError(null);
        await addContribution({ ...contributionData, hoaId });
        await loadTransactions();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [hoaId, loadTransactions]
  );

  // Add a new expense
  const addNewExpense = useCallback(
    async (expenseData) => {
      try {
        setError(null);
        await addExpense({ ...expenseData, hoaId });
        await loadTransactions();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [hoaId, loadTransactions]
  );

  // Update a contribution with optimistic updates
  const updateExistingContribution = useCallback(
    async (contributionId, updates) => {
      setError(null);

      // Optimistic update - update local state immediately
      setTransactions(prev => prev.map(t =>
        t.id === contributionId && t.transactionType === 'contribution'
          ? { ...t, ...updates }
          : t
      ));
      setContributions(prev => prev.map(c =>
        c.id === contributionId ? { ...c, ...updates } : c
      ));

      // Update database in background
      try {
        await updateContribution(contributionId, updates);
        // Recalculate financial summary without full reload
        const summary = await getFinancialSummary(hoaId);
        setFinancialSummary(summary);
      } catch (err) {
        setError(err.message);
        // On error, reload everything to revert optimistic changes
        await loadTransactions();
        throw err;
      }
    },
    [hoaId, loadTransactions]
  );

  // Update an expense with optimistic updates
  const updateExistingExpense = useCallback(
    async (expenseId, updates) => {
      setError(null);

      // Optimistic update - update local state immediately
      setTransactions(prev => prev.map(t =>
        t.id === expenseId && t.transactionType === 'expense'
          ? { ...t, ...updates }
          : t
      ));
      setExpenses(prev => prev.map(e =>
        e.id === expenseId ? { ...e, ...updates } : e
      ));

      // Update database in background
      try {
        await updateExpense(expenseId, updates);
        // Recalculate financial summary without full reload
        const summary = await getFinancialSummary(hoaId);
        setFinancialSummary(summary);
      } catch (err) {
        setError(err.message);
        // On error, reload everything to revert optimistic changes
        await loadTransactions();
        throw err;
      }
    },
    [hoaId, loadTransactions]
  );

  // Delete a contribution
  const removeContribution = useCallback(
    async (contributionId) => {
      try {
        setError(null);
        await deleteContribution(contributionId);
        await loadTransactions();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [loadTransactions]
  );

  // Delete an expense
  const removeExpense = useCallback(
    async (expenseId) => {
      try {
        setError(null);
        await deleteExpense(expenseId);
        await loadTransactions();
      } catch (err) {
        setError(err.message);
        throw err;
      }
    },
    [loadTransactions]
  );

  return {
    // Data
    transactions,
    contributions,
    expenses,
    financialSummary,

    // State
    loading,
    error,

    // Methods (using consistent naming with database layer)
    addContribution: addNewContribution,
    addExpense: addNewExpense,
    updateContribution: updateExistingContribution,
    updateExpense: updateExistingExpense,
    deleteContribution: removeContribution,
    deleteExpense: removeExpense,

    // Utility
    refresh: loadTransactions,
  };
}
