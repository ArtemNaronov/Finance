import { create } from 'zustand';
import {
  analyticsApi,
  categoriesApi,
  goalsApi,
  insightsApi,
  reportsApi,
  transactionsApi,
} from '@/api';
import type { CategoriesResponse, DashboardData, GoalWithStats } from '@/types';
import type {
  AnalyticsData,
  Insight,
  MonthlyReport,
  Recommendation,
  Transaction,
} from '@/types';

interface FinanceState {
  transactions: Transaction[];
  insights: Insight[];
  recommendations: Recommendation[];
  dashboard: DashboardData | null;
  dashboardPeriod: { month: number; year: number } | null;
  analytics: AnalyticsData | null;
  reports: MonthlyReport[];
  goals: GoalWithStats[];
  categories: CategoriesResponse | null;
  loading: boolean;
  goalsLoading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  fetchDashboard: (month?: number, year?: number) => Promise<void>;
  fetchAnalytics: () => Promise<void>;
  fetchInsights: () => Promise<void>;
  fetchRecommendations: () => Promise<void>;
  fetchReports: () => Promise<void>;
  fetchGoals: () => Promise<void>;
  fetchCategories: () => Promise<CategoriesResponse>;
  addTransaction: (
    data: Omit<Transaction, 'id' | 'createdAt'>,
  ) => Promise<{ insight: Insight | null; insightPending?: boolean }>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  createGoal: (data: Parameters<typeof goalsApi.create>[0]) => Promise<GoalWithStats>;
  updateGoal: (
    id: string,
    data: Parameters<typeof goalsApi.update>[1],
  ) => Promise<GoalWithStats>;
  deleteGoal: (id: string) => Promise<void>;
  contributeToGoal: (
    id: string,
    data: { amount: number; date: string; comment?: string },
  ) => Promise<GoalWithStats>;
  duplicateTransaction: (id: string) => Promise<void>;
  archiveGoal: (id: string, archived?: boolean) => Promise<GoalWithStats>;
  refreshAll: () => Promise<void>;
  refreshAfterMutation: () => Promise<void>;
  invalidateAnalytics: () => void;
}

async function runQuietly(fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
  } catch (e) {
    console.error(e);
  }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  transactions: [],
  insights: [],
  recommendations: [],
  dashboard: null,
  dashboardPeriod: null,
  analytics: null,
  reports: [],
  goals: [],
  categories: null,
  loading: true,
  goalsLoading: false,
  error: null,

  fetchTransactions: async () => {
    const transactions = await transactionsApi.getAll();
    set({ transactions });
  },

  fetchDashboard: async (month?: number, year?: number) => {
    const period = month && year ? { month, year } : get().dashboardPeriod ?? undefined;
    const m = month ?? period?.month;
    const y = year ?? period?.year;
    const dashboard = await analyticsApi.getDashboard(m, y);
    if (m && y) set({ dashboard, dashboardPeriod: { month: m, year: y } });
    else set({ dashboard });
  },

  fetchAnalytics: async () => {
    const analytics = await analyticsApi.getFull();
    set({ analytics });
  },

  fetchInsights: async () => {
    const insights = await insightsApi.getAll(10);
    set({ insights });
  },

  fetchRecommendations: async () => {
    const recommendations = await analyticsApi.getRecommendations();
    set({ recommendations });
  },

  fetchReports: async () => {
    const reports = await reportsApi.getAll();
    set({ reports });
  },

  fetchGoals: async () => {
    set({ goalsLoading: true });
    try {
      const goals = await goalsApi.getAll();
      set({ goals });
    } finally {
      set({ goalsLoading: false });
    }
  },

  fetchCategories: async () => {
    const cached = get().categories;
    if (cached) return cached;
    const categories = await categoriesApi.getAll();
    set({ categories });
    return categories;
  },

  addTransaction: async (data) => {
    const result = await transactionsApi.create(data);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
    return {
      insight: result.insight,
      insightPending: result.insightPending,
    };
  },

  updateTransaction: async (id, data) => {
    await transactionsApi.update(id, data);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
  },

  deleteTransaction: async (id) => {
    await transactionsApi.delete(id);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
  },

  createGoal: async (data) => {
    const goal = await goalsApi.create(data);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
    return goal;
  },

  updateGoal: async (id, data) => {
    const goal = await goalsApi.update(id, data);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
    return goal;
  },

  deleteGoal: async (id) => {
    await goalsApi.delete(id);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
  },

  contributeToGoal: async (id, data) => {
    const goal = await goalsApi.contribute(id, data);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
    return goal;
  },

  duplicateTransaction: async (id) => {
    await transactionsApi.duplicate(id);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
  },

  archiveGoal: async (id, archived = true) => {
    const goal = await goalsApi.archive(id, archived);
    get().invalidateAnalytics();
    await get().refreshAfterMutation();
    return goal;
  },

  refreshAfterMutation: async () => {
    set({ error: null });
    await Promise.all([
      runQuietly(() => get().fetchTransactions()),
      runQuietly(() => get().fetchDashboard()),
      runQuietly(() => get().fetchGoals()),
      runQuietly(() => get().fetchInsights()),
      runQuietly(() => get().fetchRecommendations()),
    ]);
  },

  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchTransactions(),
        get().fetchDashboard(),
        get().fetchInsights(),
        get().fetchRecommendations(),
        get().fetchGoals(),
        get().fetchCategories(),
      ]);
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'Ошибка загрузки' });
    } finally {
      set({ loading: false });
    }
  },

  invalidateAnalytics: () => {
    set({ analytics: null });
  },
}));
