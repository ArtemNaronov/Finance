export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  comment: string;
  createdAt: string;
}

export type GoalType = 'savings' | 'credit';

export interface Goal {
  id: string;
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyPayment: number;
  interestRate: number;
  deadline?: string;
  archived?: boolean;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  comment: string;
  createdAt: string;
}

export interface GoalWithStats extends Goal {
  progressPercent: number;
  remainingAmount: number;
  recommendedMonthlyPayment: number;
  monthsLeft: number;
  contributions: GoalContribution[];
}

export interface Insight {
  id: string;
  text: string;
  createdAt: string;
  transactionId?: string;
}

export interface MonthlyReport {
  id: string;
  month: number;
  year: number;
  summary: string;
  recommendations: string;
  createdAt: string;
}

export interface CategoryStats {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface MonthStats {
  month: number;
  year: number;
  income: number;
  expense: number;
  piggyTransfers: number;
  goalDeposits: number;
  piggyDeposits: number;
  creditGoalPayments: number;
  creditTransfers: number;
  creditPayments: number;
  totalInSavingsGoals: number;
  balance: number;
  transactionCount: number;
  byCategory: CategoryStats[];
  byDay: { date: string; amount: number }[];
}

export interface AnalyticsData {
  avgDailyExpense: number;
  avgMonthlyExpense: number;
  topExpenses: Transaction[];
  topCategories: CategoryStats[];
  categoryGrowth: { category: string; current: number; previous: number; changePercent: number }[];
  monthComparison: { month: string; income: number; expense: number; balance: number }[];
  cumulativeStats: { month: string; totalIncome: number; totalExpense: number }[];
  goals: GoalWithStats[];
  totalSaved: number;
  totalDebt: number;
}

export interface Recommendation {
  id: string;
  text: string;
  source: 'code' | 'ai';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface CategoriesResponse {
  income: string[];
  expense: string[];
  transfer: string[];
}

export interface RecurringTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  comment: string;
  dayOfMonth: number;
  active: boolean;
  lastApplied?: string;
  createdAt: string;
}

export interface CategoryBudget {
  id: string;
  category: string;
  month: number;
  year: number;
  limitAmount: number;
}

export interface BudgetStatus extends CategoryBudget {
  spent: number;
  remaining: number;
  percentUsed: number;
  overBudget: boolean;
}

export interface CreditReminder {
  goalId: string;
  name: string;
  amount: number;
  dueDay: number;
  daysUntil: number;
  overdue: boolean;
  message: string;
}

export interface DashboardData {
  current: MonthStats;
  previous: MonthStats;
  monthly: MonthStats[];
  budgets?: BudgetStatus[];
  creditReminders?: CreditReminder[];
  monthEndHint?: string | null;
  selectedMonth?: { month: number; year: number };
}
