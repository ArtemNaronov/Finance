import dayjs from 'dayjs';
import db from '../db/index.js';
import { formatMoney } from '../shared/format.js';
import { rowToTransaction } from '../shared/mappers.js';
import {
  isCreditTransferCategory,
  isPiggyTransferCategory,
  isTransferCategory,
} from '../config/categories.js';
import {
  buildGoalsContext,
  computeGoalRecommendations,
  getAllGoals,
  getContributionsBreakdownInRange,
  getTotalSavingsBalance,
} from './goals.js';
import type {
  AnalyticsData,
  CategoryStats,
  MonthStats,
  Recommendation,
  Transaction,
} from '../types/index.js';

export function isRealExpense(transaction: Transaction): boolean {
  return transaction.type === 'expense' && !isTransferCategory(transaction.category);
}

export function isPiggyTransfer(transaction: Transaction): boolean {
  return transaction.type === 'expense' && isPiggyTransferCategory(transaction.category);
}

export function isCreditTransfer(transaction: Transaction): boolean {
  return transaction.type === 'expense' && isCreditTransferCategory(transaction.category);
}

export function getAllTransactions(): Transaction[] {
  const rows = db.prepare('SELECT * FROM transactions ORDER BY date DESC, createdAt DESC').all();
  return rows.map((r) => rowToTransaction(r as Record<string, unknown>));
}

export function getTransactionsInRange(start: string, end: string): Transaction[] {
  const rows = db
    .prepare('SELECT * FROM transactions WHERE date >= ? AND date <= ? ORDER BY date DESC')
    .all(start, end);
  return rows.map((r) => rowToTransaction(r as Record<string, unknown>));
}

function sumByType(transactions: Transaction[], type: 'income' | 'expense'): number {
  return transactions
    .filter((t) => t.type === type)
    .reduce((sum, t) => sum + t.amount, 0);
}

function sumRealExpenses(transactions: Transaction[]): number {
  return transactions.filter(isRealExpense).reduce((sum, t) => sum + t.amount, 0);
}

function sumPiggyTransfers(transactions: Transaction[]): number {
  return transactions.filter(isPiggyTransfer).reduce((sum, t) => sum + t.amount, 0);
}

function sumCreditTransfers(transactions: Transaction[]): number {
  return transactions.filter(isCreditTransfer).reduce((sum, t) => sum + t.amount, 0);
}

function groupByCategory(
  transactions: Transaction[],
  type: 'expense' | 'income' = 'expense',
  realOnly = false,
): CategoryStats[] {
  let filtered = transactions.filter((t) => t.type === type);
  if (realOnly && type === 'expense') {
    filtered = filtered.filter(isRealExpense);
  }

  const total = filtered.reduce((sum, t) => sum + t.amount, 0);
  const map = new Map<string, { total: number; count: number }>();

  for (const t of filtered) {
    const existing = map.get(t.category) || { total: 0, count: 0 };
    map.set(t.category, {
      total: existing.total + t.amount,
      count: existing.count + 1,
    });
  }

  return Array.from(map.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
      percentage: total > 0 ? Math.round((data.total / total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

function groupByDay(transactions: Transaction[]): { date: string; amount: number }[] {
  const expenses = transactions.filter(isRealExpense);
  const map = new Map<string, number>();

  for (const t of expenses) {
    map.set(t.date, (map.get(t.date) || 0) + t.amount);
  }

  return Array.from(map.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getMonthStats(month: number, year: number, totalInSavingsGoals?: number): MonthStats {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD');
  const end = dayjs(start).endOf('month').format('YYYY-MM-DD');
  const transactions = getTransactionsInRange(start, end);
  const income = sumByType(transactions, 'income');
  const expense = sumRealExpenses(transactions);
  const piggyTransfers = sumPiggyTransfers(transactions);
  const creditTransfers = sumCreditTransfers(transactions);
  const { savings: goalDeposits, credit: creditGoalPayments } = getContributionsBreakdownInRange(
    start,
    end,
  );
  const piggyDeposits = piggyTransfers + goalDeposits;
  const creditPayments = creditTransfers + creditGoalPayments;

  return {
    month,
    year,
    income,
    expense,
    piggyTransfers,
    goalDeposits,
    piggyDeposits,
    creditGoalPayments,
    creditTransfers,
    creditPayments,
    totalInSavingsGoals: totalInSavingsGoals ?? getTotalSavingsBalance(),
    balance: income - expense - piggyDeposits - creditPayments,
    transactionCount: transactions.length,
    byCategory: groupByCategory(transactions, 'expense', true),
    byDay: groupByDay(transactions),
  };
}

export function getCurrentMonthStats(): MonthStats {
  const now = dayjs();
  return getMonthStats(now.month() + 1, now.year());
}

export function getPreviousMonthStats(): MonthStats {
  const prev = dayjs().subtract(1, 'month');
  return getMonthStats(prev.month() + 1, prev.year());
}

export function getMonthsStatsEndingAt(month: number, year: number, n: number): MonthStats[] {
  const totalInSavingsGoals = getTotalSavingsBalance();
  const result: MonthStats[] = [];
  const anchor = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
  for (let i = 0; i < n; i++) {
    const d = anchor.subtract(i, 'month');
    result.push(getMonthStats(d.month() + 1, d.year(), totalInSavingsGoals));
  }
  return result;
}

export function getLastNMonthsStats(n: number): MonthStats[] {
  const totalInSavingsGoals = getTotalSavingsBalance();
  const result: MonthStats[] = [];
  for (let i = 0; i < n; i++) {
    const d = dayjs().subtract(i, 'month');
    result.push(getMonthStats(d.month() + 1, d.year(), totalInSavingsGoals));
  }
  return result;
}

export function getCategoryStatsForMonths(
  category: string,
  months: number,
): { avg: number; totals: number[] } {
  const totals: number[] = [];
  for (let i = 0; i < months; i++) {
    const d = dayjs().subtract(i, 'month');
    const start = d.startOf('month').format('YYYY-MM-DD');
    const end = d.endOf('month').format('YYYY-MM-DD');
    const txs = getTransactionsInRange(start, end).filter(
      (t) => t.type === 'expense' && t.category === category,
    );
    totals.push(txs.reduce((s, t) => s + t.amount, 0));
  }
  const avg = totals.length > 0 ? totals.reduce((a, b) => a + b, 0) / totals.length : 0;
  return { avg, totals };
}

export function getCategoryTransactionCount(category: string, month: number, year: number): number {
  const start = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD');
  const end = dayjs(start).endOf('month').format('YYYY-MM-DD');
  return getTransactionsInRange(start, end).filter(
    (t) => t.type === 'expense' && t.category === category,
  ).length;
}

export function getAnalytics(): AnalyticsData {
  const all = getAllTransactions();
  const expenses = all.filter(isRealExpense);
  const goals = getAllGoals();
  const last12 = getLastNMonthsStats(12);
  const current = last12[0] ?? getCurrentMonthStats();
  const previous = last12[1] ?? getPreviousMonthStats();
  const last3 = last12.slice(0, 3);

  const daysInMonth = dayjs().daysInMonth();
  const avgDailyExpense = current.expense / daysInMonth;

  const monthlyExpenses = last3.map((m) => m.expense);
  const avgMonthlyExpense =
    monthlyExpenses.length > 0
      ? monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length
      : 0;

  const topExpenses = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 10);

  const currentCategories = current.byCategory;
  const prevMap = new Map(previous.byCategory.map((c) => [c.category, c.total]));

  const categoryGrowth = currentCategories.map((c) => {
    const prev = prevMap.get(c.category) || 0;
    const changePercent = prev > 0 ? Math.round(((c.total - prev) / prev) * 100) : c.total > 0 ? 100 : 0;
    return { category: c.category, current: c.total, previous: prev, changePercent };
  });

  const monthComparison = [...last12.slice(0, 6)]
    .reverse()
    .map((m) => ({
      month: dayjs(`${m.year}-${m.month}-01`).format('MMM YYYY'),
      income: m.income,
      expense: m.expense,
      balance: m.balance,
    }));

  let cumIncome = 0;
  let cumExpense = 0;
  const cumulativeStats = [...last12]
    .reverse()
    .map((m) => {
      cumIncome += m.income;
      cumExpense += m.expense;
      return {
        month: dayjs(`${m.year}-${m.month}-01`).format('MMM'),
        totalIncome: cumIncome,
        totalExpense: cumExpense,
      };
    });

  const totalSaved = goals
    .filter((g) => g.type === 'savings')
    .reduce((s, g) => s + g.currentAmount, 0);
  const totalDebt = goals
    .filter((g) => g.type === 'credit')
    .reduce((s, g) => s + g.currentAmount, 0);

  return {
    avgDailyExpense: Math.round(avgDailyExpense),
    avgMonthlyExpense: Math.round(avgMonthlyExpense),
    topExpenses,
    topCategories: currentCategories.slice(0, 10),
    categoryGrowth: categoryGrowth.sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)),
    monthComparison,
    cumulativeStats,
    goals,
    totalSaved,
    totalDebt,
  };
}

export function computeCodeRecommendations(): Recommendation[] {
  const recommendations: Recommendation[] = [];
  const current = getCurrentMonthStats();
  const previous = getPreviousMonthStats();
  const last3 = getLastNMonthsStats(3);

  for (const rec of computeGoalRecommendations()) {
    recommendations.push({ ...rec, source: 'code' });
  }

  for (const cat of current.byCategory) {
    if (isTransferCategory(cat.category)) continue;
    const prevCat = previous.byCategory.find((c) => c.category === cat.category);
    if (prevCat && prevCat.total > 0) {
      const change = Math.round(((cat.total - prevCat.total) / prevCat.total) * 100);
      if (change >= 10) {
        recommendations.push({
          id: `growth-${cat.category}`,
          text: `Расходы на «${cat.category}» выросли на ${change}%.`,
          source: 'code',
        });
      } else if (change <= -10) {
        recommendations.push({
          id: `decline-${cat.category}`,
          text: `Расходы на «${cat.category}» снизились на ${Math.abs(change)}%.`,
          source: 'code',
        });
      }
    }
  }

  if (current.byCategory.length > 0) {
    const top = current.byCategory[0];
    recommendations.push({
      id: 'top-category',
      text: `Самая затратная категория — «${top.category}» (${formatMoney(top.total)}).`,
      source: 'code',
    });
  }

  if (current.piggyDeposits > 0 || current.creditPayments > 0) {
    const parts: string[] = [];
    if (current.piggyDeposits > 0) parts.push(`копилки ${formatMoney(current.piggyDeposits)}`);
    if (current.creditPayments > 0) parts.push(`кредиты ${formatMoney(current.creditPayments)}`);
    recommendations.push({
      id: 'monthly-allocations',
      text: `За месяц ушло из свободных денег: ${formatMoney(current.piggyDeposits + current.creditPayments)} (${parts.join(', ')}).`,
      source: 'code',
    });
  }

  const avgExpense3 =
    last3.reduce((s, m) => s + m.expense, 0) / Math.max(last3.length, 1);
  for (const cat of current.byCategory.slice(0, 5)) {
    const catAvg =
      last3.reduce((s, m) => {
        const c = m.byCategory.find((x) => x.category === cat.category);
        return s + (c?.total || 0);
      }, 0) / last3.length;

    if (catAvg > 0 && cat.total > catAvg * 1.15) {
      recommendations.push({
        id: `above-avg-${cat.category}`,
        text: `Траты на «${cat.category}» выше среднего за последние 3 месяца.`,
        source: 'code',
      });
    }
  }

  const discretionary = current.byCategory.filter((c) =>
    ['Кафе', 'Кофе', 'Развлечения', 'Подписки'].includes(c.category),
  );
  const potentialSavings = discretionary.reduce((s, c) => s + c.total * 0.2, 0);
  if (potentialSavings > 1000) {
    recommendations.push({
      id: 'potential-savings',
      text: `Потенциальная экономия на развлечениях составляет около ${formatMoney(Math.round(potentialSavings))}.`,
      source: 'code',
    });
  }

  return recommendations.slice(0, 8);
}

export function buildAIContext(): string {
  const last3 = getLastNMonthsStats(3);
  const current = last3[0] ?? getCurrentMonthStats();
  const previous = last3[1] ?? getPreviousMonthStats();
  const recent = getAllTransactions().slice(0, 15);
  const goals = getAllGoals();
  const totalSaved = goals
    .filter((g) => g.type === 'savings')
    .reduce((s, g) => s + g.currentAmount, 0);
  const totalDebt = goals
    .filter((g) => g.type === 'credit')
    .reduce((s, g) => s + g.currentAmount, 0);
  const daysInMonth = dayjs().daysInMonth();
  const avgDailyExpense = Math.round(current.expense / daysInMonth);
  const avgMonthlyExpense = Math.round(
    last3.reduce((s, m) => s + m.expense, 0) / Math.max(last3.length, 1),
  );
  const prevMap = new Map(previous.byCategory.map((c) => [c.category, c.total]));
  const categoryGrowth = current.byCategory
    .map((c) => {
      const prev = prevMap.get(c.category) || 0;
      const changePercent =
        prev > 0 ? Math.round(((c.total - prev) / prev) * 100) : c.total > 0 ? 100 : 0;
      return { category: c.category, changePercent };
    })
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  const lines: string[] = [
    '=== ТЕКУЩИЙ МЕСЯЦ ===',
    `Доход: ${formatMoney(current.income)}, Расходы: ${formatMoney(current.expense)}`,
    `В копилки за месяц: ${formatMoney(current.piggyDeposits)} (переводы ${formatMoney(current.piggyTransfers)}, пополнения ${formatMoney(current.goalDeposits)})`,
    `Платежи по кредитам за месяц: ${formatMoney(current.creditPayments)} (переводы ${formatMoney(current.creditTransfers)}, платежи ${formatMoney(current.creditGoalPayments)})`,
    `Всего в копилках: ${formatMoney(current.totalInSavingsGoals)}`,
    `Свободный остаток (доход − расходы − копилки − кредиты): ${formatMoney(current.balance)}`,
    `Операций: ${current.transactionCount}`,
    'Расходы по категориям (без копилок и кредитов):',
    ...current.byCategory.map((c) => `  - ${c.category}: ${formatMoney(c.total)} (${c.percentage}%, ${c.count} операций)`),
    '',
    '=== ПРОШЛЫЙ МЕСЯЦ ===',
    `Доход: ${formatMoney(previous.income)}, Расход: ${formatMoney(previous.expense)}, Копилки: ${formatMoney(previous.piggyDeposits)}, Кредиты: ${formatMoney(previous.creditPayments)}`,
    'Расходы по категориям:',
    ...previous.byCategory.map((c) => `  - ${c.category}: ${formatMoney(c.total)}`),
    '',
    '=== КОПИЛКИ, ЦЕЛИ И КРЕДИТЫ ===',
    buildGoalsContext(),
    '',
    '=== СРЕДНИЕ ЗА 3 МЕСЯЦА ===',
    ...last3.map((m) => {
      const label = dayjs(`${m.year}-${m.month}-01`).format('MMMM YYYY');
      return `${label}: доход ${formatMoney(m.income)}, расход ${formatMoney(m.expense)}, копилки ${formatMoney(m.piggyDeposits)}, кредиты ${formatMoney(m.creditPayments)}, остаток ${formatMoney(m.balance)}`;
    }),
    '',
    '=== ТРЕНДЫ ===',
    `Средний расход в день: ${formatMoney(avgDailyExpense)}`,
    `Средний расход в месяц: ${formatMoney(avgMonthlyExpense)}`,
    `Всего в копилках: ${formatMoney(totalSaved)}`,
    `Общий долг по кредитам: ${formatMoney(totalDebt)}`,
    ...categoryGrowth.slice(0, 5).map(
      (g) => `  - ${g.category}: ${g.changePercent > 0 ? '+' : ''}${g.changePercent}% к прошлому месяцу`,
    ),
    '',
    '=== ПОСЛЕДНИЕ ОПЕРАЦИИ ===',
    ...recent.map((t) => {
      const typeLabel =
        t.type === 'income'
          ? 'доход'
          : isCreditTransferCategory(t.category)
            ? 'платёж по кредиту'
            : isPiggyTransferCategory(t.category)
              ? 'перевод в копилку'
              : 'расход';
      return `${t.date} | ${typeLabel} | ${t.category} | ${formatMoney(t.amount)}${t.comment ? ` | ${t.comment}` : ''}`;
    }),
  ];

  return lines.join('\n');
}

export function buildInsightContext(transaction: Transaction): string {
  const isTransfer = isTransferCategory(transaction.category);

  if (isTransfer) {
    const isCredit = isCreditTransferCategory(transaction.category);
    return [
      isCredit ? '=== ПЛАТЁЖ ПО КРЕДИТУ ===' : '=== ПЕРЕВОД В КОПИЛКУ ===',
      `Сумма: ${formatMoney(transaction.amount)}`,
      `Категория: ${transaction.category}`,
      `Дата: ${transaction.date}`,
      transaction.comment ? `Комментарий: ${transaction.comment}` : '',
      '',
      isCredit
        ? 'Это платёж по кредиту, не обычный расход. Сумма уменьшает свободный остаток, но не считается тратой на потребление.'
        : 'Это перевод в копилку, не расход на потребление. Сумма уменьшает свободный остаток.',
      isCredit ? 'Отметь дисциплину в погашении долга.' : 'Похвали за дисциплину или отметь прогресс к цели.',
      '',
      '=== КОПИЛКИ И ЦЕЛИ ===',
      buildGoalsContext(),
      '',
      'Подсказка: для учёта копилок используйте раздел «Копилки и цели».',
    ]
      .filter(Boolean)
      .join('\n');
  }

  const now = dayjs(transaction.date);
  const month = now.month() + 1;
  const year = now.year();
  const current = getMonthStats(month, year);
  const prev = getMonthStats(
    now.subtract(1, 'month').month() + 1,
    now.subtract(1, 'month').year(),
  );
  const catStats = getCategoryStatsForMonths(transaction.category, 3);
  const catCount = getCategoryTransactionCount(transaction.category, month, year);

  const lines = [
    '=== НОВАЯ ОПЕРАЦИЯ ===',
    `Тип: ${transaction.type === 'income' ? 'доход' : 'расход'}`,
    `Сумма: ${formatMoney(transaction.amount)}`,
    `Категория: ${transaction.category}`,
    `Дата: ${transaction.date}`,
    transaction.comment ? `Комментарий: ${transaction.comment}` : '',
    '',
    '=== ТЕКУЩИЙ МЕСЯЦ ===',
    `Расходы: ${formatMoney(current.expense)}, В копилки: ${formatMoney(current.piggyDeposits)}, Кредиты: ${formatMoney(current.creditPayments)}`,
    `Доходы: ${formatMoney(current.income)}, В копилках всего: ${formatMoney(current.totalInSavingsGoals)}`,
    `Операций в категории «${transaction.category}»: ${catCount}`,
    `Сумма в категории «${transaction.category}»: ${formatMoney(
      current.byCategory.find((c) => c.category === transaction.category)?.total || 0,
    )}`,
    '',
    '=== КОПИЛКИ И ЦЕЛИ ===',
    buildGoalsContext(),
    '',
    '=== ПРОШЛЫЙ МЕСЯЦ (та же категория) ===',
    `Сумма: ${formatMoney(prev.byCategory.find((c) => c.category === transaction.category)?.total || 0)}`,
    '',
    '=== СРЕДНЕЕ ЗА 3 МЕСЯЦА (категория) ===',
    `Среднее: ${formatMoney(Math.round(catStats.avg))}`,
    `По месяцам: ${catStats.totals.map(formatMoney).join(', ')}`,
    '',
    '=== ТОП КАТЕГОРИЙ ТЕКУЩЕГО МЕСЯЦА (без накоплений) ===',
    ...current.byCategory.slice(0, 5).map(
      (c, i) => `${i + 1}. ${c.category}: ${formatMoney(c.total)}`,
    ),
  ];

  return lines.filter(Boolean).join('\n');
}
