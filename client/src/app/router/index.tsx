import { Suspense, lazy, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { MainLayout } from '@/widgets/layout/MainLayout';

const DashboardPage = lazy(() =>
  import('@/pages/Dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const TransactionsPage = lazy(() =>
  import('@/pages/Transactions/TransactionsPage').then((m) => ({ default: m.TransactionsPage })),
);
const AddTransactionPage = lazy(() =>
  import('@/pages/AddTransaction/AddTransactionPage').then((m) => ({ default: m.AddTransactionPage })),
);
const GoalsPage = lazy(() =>
  import('@/pages/Goals/GoalsPage').then((m) => ({ default: m.GoalsPage })),
);
const AnalyticsPage = lazy(() =>
  import('@/pages/Analytics/AnalyticsPage').then((m) => ({ default: m.AnalyticsPage })),
);
const AIAssistantPage = lazy(() =>
  import('@/pages/AIAssistant/AIAssistantPage').then((m) => ({ default: m.AIAssistantPage })),
);
const DiaryPage = lazy(() =>
  import('@/pages/Diary/DiaryPage').then((m) => ({ default: m.DiaryPage })),
);
const BudgetsPage = lazy(() =>
  import('@/pages/Budgets/BudgetsPage').then((m) => ({ default: m.BudgetsPage })),
);
const RecurringPage = lazy(() =>
  import('@/pages/Recurring/RecurringPage').then((m) => ({ default: m.RecurringPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/Settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function PageLoader() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  );
}

function lazyPage(Page: ComponentType) {
  return (
    <Suspense fallback={<PageLoader />}>
      <Page />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: lazyPage(DashboardPage) },
      { path: 'transactions', element: lazyPage(TransactionsPage) },
      { path: 'add', element: lazyPage(AddTransactionPage) },
      { path: 'goals', element: lazyPage(GoalsPage) },
      { path: 'budgets', element: lazyPage(BudgetsPage) },
      { path: 'recurring', element: lazyPage(RecurringPage) },
      { path: 'analytics', element: lazyPage(AnalyticsPage) },
      { path: 'ai', element: lazyPage(AIAssistantPage) },
      { path: 'diary', element: lazyPage(DiaryPage) },
      { path: 'settings', element: lazyPage(SettingsPage) },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
