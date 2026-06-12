import type { Goal, GoalContribution, Transaction } from '../types/index.js';

export function rowToTransaction(row: Record<string, unknown>): Transaction {
  return {
    id: row.id as string,
    type: row.type as Transaction['type'],
    amount: row.amount as number,
    category: row.category as string,
    date: row.date as string,
    comment: (row.comment as string) || '',
    createdAt: row.createdAt as string,
  };
}

export function rowToGoal(row: Record<string, unknown>): Goal {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Goal['type'],
    targetAmount: row.targetAmount as number,
    currentAmount: row.currentAmount as number,
    monthlyPayment: (row.monthlyPayment as number) || 0,
    interestRate: (row.interestRate as number) || 0,
    deadline: (row.deadline as string) || undefined,
    archived: Boolean(row.archived),
    createdAt: row.createdAt as string,
  };
}

export function rowToContribution(row: Record<string, unknown>): GoalContribution {
  return {
    id: row.id as string,
    goalId: row.goalId as string,
    amount: row.amount as number,
    date: row.date as string,
    comment: (row.comment as string) || '',
    createdAt: row.createdAt as string,
  };
}
