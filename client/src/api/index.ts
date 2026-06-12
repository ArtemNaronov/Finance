import { apiClient } from './client';
import type {
  AnalyticsData,
  BudgetStatus,
  CategoriesResponse,
  DashboardData,
  GoalWithStats,
  Insight,
  MonthlyReport,
  RecurringTransaction,
  Recommendation,
  Transaction,
} from '@/types';

export const transactionsApi = {
  getAll: () => apiClient.get<Transaction[]>('/transactions').then((r) => r.data),
  getById: (id: string) => apiClient.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
  create: (data: Omit<Transaction, 'id' | 'createdAt'>) =>
    apiClient
      .post<{
        transaction: Transaction;
        insight: Insight | null;
        insightPending?: boolean;
        insightError?: string;
      }>('/transactions', data)
      .then((r) => r.data),
  update: (id: string, data: Partial<Transaction>) =>
    apiClient.put<Transaction>(`/transactions/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/transactions/${id}`),
  duplicate: (id: string) =>
    apiClient.post<Transaction>(`/transactions/${id}/duplicate`).then((r) => r.data),
};

export const insightsApi = {
  getAll: (limit = 10) =>
    apiClient.get<Insight[]>(`/insights?limit=${limit}`).then((r) => r.data),
};

export const analyticsApi = {
  getDashboard: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    const q = params.toString();
    return apiClient
      .get<DashboardData>(`/analytics/dashboard${q ? `?${q}` : ''}`)
      .then((r) => r.data);
  },
  getFull: () => apiClient.get<AnalyticsData>('/analytics/full').then((r) => r.data),
  getRecommendations: () =>
    apiClient.get<Recommendation[]>('/analytics/recommendations').then((r) => r.data),
};

export const reportsApi = {
  getAll: () => apiClient.get<MonthlyReport[]>('/reports').then((r) => r.data),
  generate: (month?: number, year?: number) =>
    apiClient
      .post<MonthlyReport>('/reports/generate', { month, year })
      .then((r) => r.data),
};

export const aiApi = {
  chat: (message: string) =>
    apiClient.post<{ reply: string }>('/ai/chat', { message }).then((r) => r.data),
};

export const categoriesApi = {
  getAll: () => apiClient.get<CategoriesResponse>('/categories').then((r) => r.data),
};

export const goalsApi = {
  getAll: () => apiClient.get<GoalWithStats[]>('/goals').then((r) => r.data),
  getById: (id: string) => apiClient.get<GoalWithStats>(`/goals/${id}`).then((r) => r.data),
  create: (data: {
    name: string;
    type: 'savings' | 'credit';
    targetAmount: number;
    monthlyPayment?: number;
    interestRate?: number;
    deadline?: string;
    initialAmount?: number;
  }) => apiClient.post<GoalWithStats>('/goals', data).then((r) => r.data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      targetAmount: number;
      currentAmount: number;
      monthlyPayment: number;
      interestRate: number;
      deadline: string | null;
    }>,
  ) => apiClient.put<GoalWithStats>(`/goals/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/goals/${id}`),
  contribute: (id: string, data: { amount: number; date: string; comment?: string }) =>
    apiClient.post<GoalWithStats>(`/goals/${id}/contribute`, data).then((r) => r.data),
  archive: (id: string, archived = true) =>
    apiClient.post<GoalWithStats>(`/goals/${id}/archive`, { archived }).then((r) => r.data),
};

export const recurringApi = {
  getAll: () => apiClient.get<RecurringTransaction[]>('/recurring').then((r) => r.data),
  create: (data: Omit<RecurringTransaction, 'id' | 'active' | 'createdAt' | 'lastApplied'>) =>
    apiClient.post<RecurringTransaction>('/recurring', data).then((r) => r.data),
  update: (id: string, data: Partial<RecurringTransaction>) =>
    apiClient.put<RecurringTransaction>(`/recurring/${id}`, data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/recurring/${id}`),
};

export const budgetsApi = {
  getStatus: (month?: number, year?: number) => {
    const params = new URLSearchParams();
    if (month) params.set('month', String(month));
    if (year) params.set('year', String(year));
    const q = params.toString();
    return apiClient.get<BudgetStatus[]>(`/budgets/status${q ? `?${q}` : ''}`).then((r) => r.data);
  },
  set: (data: { category: string; month: number; year: number; limitAmount: number }) =>
    apiClient.post('/budgets', data).then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/budgets/${id}`),
};

export const dataApi = {
  exportJson: () =>
    apiClient.get('/data/export', { responseType: 'blob' }).then((r) => r.data as Blob),
  importJson: (data: unknown, mode: 'merge' | 'replace' = 'merge') =>
    apiClient.post('/data/import', { data, mode }).then((r) => r.data),
  importBankCsv: (content: string, preview = false) =>
    apiClient.post('/data/import-bank-csv', { content, preview }).then((r) => r.data),
};

export const searchApi = {
  search: (q: string) =>
    apiClient.get<{ transactions: Transaction[]; goals: unknown[] }>(`/search?q=${encodeURIComponent(q)}`).then((r) => r.data),
};

export const settingsApi = {
  getAll: () => apiClient.get<Record<string, string>>('/settings').then((r) => r.data),
  set: (key: string, value: string) =>
    apiClient.put(`/settings/${key}`, { value }).then((r) => r.data),
};

export const versionApi = {
  get: () => apiClient.get<{ version: string }>('/version').then((r) => r.data),
};
