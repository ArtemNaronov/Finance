import { useEffect, useState } from 'react';
import { Alert, Box } from '@mui/material';
import dayjs from 'dayjs';
import { PageHeader } from '@/shared/ui/PageHeader';
import { MonthPicker } from '@/shared/ui/MonthPicker';
import { StatsCards } from '@/widgets/StatsCards/StatsCards';
import { ExpenseCharts } from '@/widgets/ExpenseCharts/ExpenseCharts';
import { RecentTransactions } from '@/widgets/RecentTransactions/RecentTransactions';
import { InsightsBlock } from '@/widgets/InsightsBlock/InsightsBlock';
import { RecommendationsBlock } from '@/widgets/RecommendationsBlock/RecommendationsBlock';
import { GoalsBlock } from '@/widgets/GoalsBlock/GoalsBlock';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Grid } from '@mui/material';

export function DashboardPage() {
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const dashboard = useFinanceStore((s) => s.dashboard);
  const fetchDashboard = useFinanceStore((s) => s.fetchDashboard);
  const transactions = useFinanceStore((s) => s.transactions);
  const insights = useFinanceStore((s) => s.insights);
  const recommendations = useFinanceStore((s) => s.recommendations);
  const goals = useFinanceStore((s) => s.goals);
  const loading = useFinanceStore((s) => s.loading);

  useEffect(() => {
    fetchDashboard(month, year);
  }, [month, year, fetchDashboard]);

  const isCurrentMonth = dayjs(`${year}-${month}-01`).isSame(now, 'month');

  return (
    <>
      <PageHeader
        title="Дашборд"
        subtitle={isCurrentMonth ? 'Обзор ваших финансов за текущий месяц' : 'Обзор за выбранный месяц'}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <MonthPicker
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
              }}
            />
          </Box>
        }
      />

      {dashboard?.monthEndHint && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {dashboard.monthEndHint}
        </Alert>
      )}

      {dashboard?.creditReminders?.map((r) => (
        <Alert key={r.goalId} severity={r.overdue ? 'warning' : 'info'} sx={{ mb: 1 }}>
          {r.message}
        </Alert>
      ))}

      {dashboard?.budgets?.filter((b) => b.overBudget).map((b) => (
        <Alert key={b.id} severity="warning" sx={{ mb: 1 }}>
          Бюджет «{b.category}» превышен
        </Alert>
      ))}

      <StatsCards stats={dashboard?.current ?? null} loading={loading} />
      <ExpenseCharts current={dashboard?.current ?? null} monthly={dashboard?.monthly ?? []} />

      <Grid container spacing={2} sx={{ mt: 1, alignItems: 'stretch' }}>
        <Grid item xs={12} lg={7} sx={{ display: 'flex' }}>
          <RecentTransactions transactions={transactions} />
        </Grid>
        <Grid item xs={12} lg={5} sx={{ display: 'flex' }}>
          <GoalsBlock goals={goals} layout="column" />
        </Grid>

        <Grid item xs={12} lg={4} sx={{ display: 'flex' }}>
          <InsightsBlock insights={insights} />
        </Grid>
        <Grid item xs={12} lg={8} sx={{ display: 'flex' }}>
          <RecommendationsBlock recommendations={recommendations} />
        </Grid>
      </Grid>
    </>
  );
}
