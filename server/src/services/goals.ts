import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../db/index.js';
import type { Goal, GoalContribution, GoalType, GoalWithStats } from '../types/index.js';
import { formatMoney } from '../shared/format.js';
import { rowToContribution, rowToGoal } from '../shared/mappers.js';

export function getMonthsUntilDeadline(deadline?: string): number {
  if (!deadline) return 12;
  const months = dayjs(deadline).diff(dayjs(), 'month', true);
  return Math.max(1, Math.ceil(months));
}

/** Аннуитетный платёж по кредиту */
export function calcCreditMonthlyPayment(
  remaining: number,
  annualRatePercent: number,
  monthsLeft: number,
): number {
  if (remaining <= 0) return 0;
  if (monthsLeft <= 0) return remaining;
  const r = annualRatePercent / 100 / 12;
  if (r === 0) return Math.ceil(remaining / monthsLeft);
  const factor = Math.pow(1 + r, monthsLeft);
  return Math.ceil((remaining * r * factor) / (factor - 1));
}

export function calcSavingsMonthlyNeeded(remaining: number, monthsLeft: number): number {
  if (remaining <= 0) return 0;
  return Math.ceil(remaining / Math.max(1, monthsLeft));
}

export function enrichGoal(goal: Goal, contributions?: GoalContribution[]): GoalWithStats {
  const contribs =
    contributions ??
    db
      .prepare('SELECT * FROM goal_contributions WHERE goalId = ? ORDER BY date DESC')
      .all(goal.id)
      .map((r) => rowToContribution(r as Record<string, unknown>));

  const monthsLeft = getMonthsUntilDeadline(goal.deadline);

  let progressPercent: number;
  let remainingAmount: number;
  let recommendedMonthlyPayment: number;

  if (goal.type === 'savings') {
    remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);
    progressPercent =
      goal.targetAmount > 0
        ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
        : 0;
    recommendedMonthlyPayment =
      goal.monthlyPayment > 0
        ? goal.monthlyPayment
        : calcSavingsMonthlyNeeded(remainingAmount, monthsLeft);
  } else {
    remainingAmount = goal.currentAmount;
    progressPercent =
      goal.targetAmount > 0
        ? Math.min(100, Math.round(((goal.targetAmount - goal.currentAmount) / goal.targetAmount) * 100))
        : 0;
    recommendedMonthlyPayment =
      goal.monthlyPayment > 0
        ? goal.monthlyPayment
        : calcCreditMonthlyPayment(goal.currentAmount, goal.interestRate, monthsLeft);
  }

  return {
    ...goal,
    progressPercent,
    remainingAmount,
    recommendedMonthlyPayment,
    monthsLeft,
    contributions: contribs,
  };
}

export function getAllGoals(includeArchived = false): GoalWithStats[] {
  const rows = includeArchived
    ? db.prepare('SELECT * FROM goals ORDER BY createdAt DESC').all()
    : db.prepare('SELECT * FROM goals WHERE archived = 0 ORDER BY createdAt DESC').all();
  const goals = rows.map((r) => rowToGoal(r as Record<string, unknown>));
  if (goals.length === 0) return [];

  const allContribs = db
    .prepare('SELECT * FROM goal_contributions ORDER BY date DESC')
    .all()
    .map((r) => rowToContribution(r as Record<string, unknown>));

  const byGoalId = new Map<string, GoalContribution[]>();
  for (const c of allContribs) {
    const list = byGoalId.get(c.goalId) ?? [];
    list.push(c);
    byGoalId.set(c.goalId, list);
  }

  return goals.map((g) => enrichGoal(g, byGoalId.get(g.id) ?? []));
}

export function getGoalById(id: string): GoalWithStats | null {
  const row = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!row) return null;
  return enrichGoal(rowToGoal(row as Record<string, unknown>));
}

export function createGoal(data: {
  name: string;
  type: GoalType;
  targetAmount: number;
  monthlyPayment?: number;
  interestRate?: number;
  deadline?: string;
  initialAmount?: number;
}): GoalWithStats {
  const id = uuidv4();
  const now = new Date().toISOString();

  let currentAmount = 0;
  if (data.type === 'credit') {
    currentAmount = data.targetAmount;
  } else if (data.initialAmount) {
    currentAmount = data.initialAmount;
  }

  db.prepare(
    `INSERT INTO goals (id, name, type, targetAmount, currentAmount, monthlyPayment, interestRate, deadline, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    data.name,
    data.type,
    data.targetAmount,
    currentAmount,
    data.monthlyPayment || 0,
    data.interestRate || 0,
    data.deadline || null,
    now,
  );

  return getGoalById(id)!;
}

export function updateGoal(
  id: string,
  data: Partial<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    monthlyPayment: number;
    interestRate: number;
    deadline: string | null;
  }>,
): GoalWithStats | null {
  const existing = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!existing) return null;

  const goal = rowToGoal(existing as Record<string, unknown>);

  const target = data.targetAmount ?? goal.targetAmount;
  const currentAmount = Math.max(0, Math.min(data.currentAmount ?? goal.currentAmount, target));

  db.prepare(
    `UPDATE goals SET name = ?, targetAmount = ?, currentAmount = ?, monthlyPayment = ?, interestRate = ?, deadline = ? WHERE id = ?`,
  ).run(
    data.name ?? goal.name,
    data.targetAmount ?? goal.targetAmount,
    currentAmount,
    data.monthlyPayment ?? goal.monthlyPayment,
    data.interestRate ?? goal.interestRate,
    data.deadline !== undefined ? data.deadline || null : goal.deadline || null,
    id,
  );

  return getGoalById(id);
}

export function archiveGoal(id: string, archived = true): GoalWithStats | null {
  const result = db.prepare('UPDATE goals SET archived = ? WHERE id = ?').run(archived ? 1 : 0, id);
  if (result.changes === 0) return null;
  return getGoalById(id);
}

export function deleteGoal(id: string): boolean {
  const result = db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  return result.changes > 0;
}

export function addContribution(
  goalId: string,
  data: { amount: number; date: string; comment?: string },
): GoalWithStats | null {
  const goal = db.prepare('SELECT * FROM goals WHERE id = ?').get(goalId);
  if (!goal) return null;

  const g = rowToGoal(goal as Record<string, unknown>);
  const id = uuidv4();
  const now = new Date().toISOString();

  const apply = db.transaction(() => {
    db.prepare(
      `INSERT INTO goal_contributions (id, goalId, amount, date, comment, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(id, goalId, data.amount, data.date, data.comment || '', now);

    if (g.type === 'savings') {
      db.prepare('UPDATE goals SET currentAmount = currentAmount + ? WHERE id = ?').run(
        data.amount,
        goalId,
      );
    } else {
      const newBalance = Math.max(0, g.currentAmount - data.amount);
      db.prepare('UPDATE goals SET currentAmount = ? WHERE id = ?').run(newBalance, goalId);
    }
  });

  apply();

  return getGoalById(goalId);
}

export function getContributionsBreakdownInRange(
  start: string,
  end: string,
): { savings: number; credit: number } {
  const rows = db
    .prepare(
      `SELECT gc.amount, g.type, gc.comment FROM goal_contributions gc
       JOIN goals g ON g.id = gc.goalId
       WHERE gc.date >= ? AND gc.date <= ?`,
    )
    .all(start, end) as { amount: number; type: GoalType; comment: string }[];

  let savings = 0;
  let credit = 0;
  for (const r of rows) {
    if (r.comment === 'Начальный взнос') continue;
    if (r.type === 'savings') savings += r.amount;
    else credit += r.amount;
  }
  return { savings, credit };
}

export function getContributionsInRange(
  start: string,
  end: string,
  goalType?: GoalType,
): number {
  const breakdown = getContributionsBreakdownInRange(start, end);
  if (goalType === 'savings') return breakdown.savings;
  if (goalType === 'credit') return breakdown.credit;
  return breakdown.savings + breakdown.credit;
}

export function getTotalSavingsBalance(): number {
  const rows = db
    .prepare(`SELECT currentAmount FROM goals WHERE type = 'savings'`)
    .all() as { currentAmount: number }[];
  return rows.reduce((sum, r) => sum + r.currentAmount, 0);
}

export function getTotalCreditDebt(): number {
  const rows = db
    .prepare(`SELECT currentAmount FROM goals WHERE type = 'credit'`)
    .all() as { currentAmount: number }[];
  return rows.reduce((sum, r) => sum + r.currentAmount, 0);
}

export function buildGoalsContext(): string {
  const goals = getAllGoals();
  if (goals.length === 0) return 'Копилок и целей пока нет.';

  const lines: string[] = [
    'ВАЖНО: переводы в копилки и платежи по кредитам — это НЕ расходы для сокращения.',
    'Накопления — положительная финансовая привычка. Не рекомендуй их урезать.',
    '',
  ];

  for (const g of goals) {
    if (g.type === 'savings') {
      lines.push(
        `КОПИЛКА «${g.name}»: накоплено ${formatMoney(g.currentAmount)} из ${formatMoney(g.targetAmount)} (${g.progressPercent}%)`,
        `  Осталось: ${formatMoney(g.remainingAmount)}, рекомендуемый взнос/мес: ${formatMoney(g.recommendedMonthlyPayment)}`,
        g.deadline ? `  Срок: до ${g.deadline}` : '',
      );
    } else {
      lines.push(
        `КРЕДИТ «${g.name}»: остаток долга ${formatMoney(g.currentAmount)} из ${formatMoney(g.targetAmount)} (погашено ${g.progressPercent}%)`,
        `  Ставка: ${g.interestRate}% годовых, рекомендуемый платёж/мес: ${formatMoney(g.recommendedMonthlyPayment)}`,
        g.monthlyPayment > 0 ? `  Плановый платёж: ${formatMoney(g.monthlyPayment)}/мес` : '',
        g.deadline ? `  Срок погашения: до ${g.deadline}` : `  Месяцев до срока: ${g.monthsLeft}`,
      );
    }
    lines.push('');
  }

  return lines.filter(Boolean).join('\n');
}

export function computeGoalRecommendations(): { id: string; text: string }[] {
  const goals = getAllGoals();
  const recs: { id: string; text: string }[] = [];

  for (const g of goals) {
    if (g.type === 'savings') {
      if (g.progressPercent >= 100) {
        recs.push({
          id: `goal-done-${g.id}`,
          text: `Цель «${g.name}» достигнута — накоплено ${formatMoney(g.currentAmount)}!`,
        });
      } else if (g.remainingAmount > 0) {
        recs.push({
          id: `goal-save-${g.id}`,
          text: `Для «${g.name}» осталось ${formatMoney(g.remainingAmount)}. Рекомендуемый взнос: ${formatMoney(g.recommendedMonthlyPayment)}/мес.`,
        });
      }
    } else if (g.currentAmount > 0) {
      const planned = g.monthlyPayment > 0 ? g.monthlyPayment : g.recommendedMonthlyPayment;
      recs.push({
        id: `goal-credit-${g.id}`,
        text: `По кредиту «${g.name}» остаток ${formatMoney(g.currentAmount)}. Рекомендуемый платёж: ${formatMoney(planned)}/мес.`,
      });
      if (g.monthlyPayment > 0 && g.monthlyPayment < g.recommendedMonthlyPayment) {
        recs.push({
          id: `goal-credit-low-${g.id}`,
          text: `Платёж ${formatMoney(g.monthlyPayment)}/мес по «${g.name}» ниже рекомендуемого — срок может увеличиться.`,
        });
      }
    }
  }

  return recs;
}
