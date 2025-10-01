import { useState, useEffect, useCallback } from 'react';
import {
  getContributionsByHOA,
  getExpensesByHOA,
  addContribution,
  addExpense,
  deleteContribution,
  deleteExpense,
  getFinancialSummary,
} from '../db/database';

export function useFinancials(hoaId) {
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

  // Load all financial data
  const loadFinancials = useCallback(async () => {
    if (!hoaId) return;

    try {
      setLoading(true);
      setError(null);

      const [contribs, exps, summary] = await Promise.all([
        getContributionsByHOA(hoaId),
        getExpensesByHOA(hoaId),
        getFinancialSummary(hoaId),
      ]);

      // Sort by creation date (newest first)
      setContributions(contribs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setExpenses(exps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      setFinancialSummary(summary);
    } catch (err) {
      console.error('Error loading financials:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hoaId]);

  // Load financials on mount and when hoaId changes
  useEffect(() => {
    loadFinancials();
  }, [loadFinancials]);

  // Add a new contribution
  const createContribution = useCallback(
    async (contributionData) => {
      try {
        setError(null);
        await addContribution({ ...contributionData, hoaId });
        await loadFinancials();
      } catch (err) {
        console.error('Error adding contribution:', err);
        setError(err.message);
        throw err;
      }
    },
    [hoaId, loadFinancials]
  );

  // Add a new expense
  const createExpense = useCallback(
    async (expenseData) => {
      try {
        setError(null);
        await addExpense({ ...expenseData, hoaId });
        await loadFinancials();
      } catch (err) {
        console.error('Error adding expense:', err);
        setError(err.message);
        throw err;
      }
    },
    [hoaId, loadFinancials]
  );

  // Delete a contribution
  const removeContribution = useCallback(
    async (contributionId) => {
      try {
        setError(null);
        await deleteContribution(contributionId);
        await loadFinancials();
      } catch (err) {
        console.error('Error deleting contribution:', err);
        setError(err.message);
        throw err;
      }
    },
    [loadFinancials]
  );

  // Delete an expense
  const removeExpense = useCallback(
    async (expenseId) => {
      try {
        setError(null);
        await deleteExpense(expenseId);
        await loadFinancials();
      } catch (err) {
        console.error('Error deleting expense:', err);
        setError(err.message);
        throw err;
      }
    },
    [loadFinancials]
  );

  return {
    contributions,
    expenses,
    financialSummary,
    loading,
    error,
    createContribution,
    createExpense,
    removeContribution,
    removeExpense,
    refresh: loadFinancials,
  };
}
