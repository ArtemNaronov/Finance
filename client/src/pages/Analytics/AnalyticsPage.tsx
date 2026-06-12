import { useEffect } from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  useTheme,
} from '@mui/material';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { PageHeader } from '@/shared/ui/PageHeader';
import { StatCard } from '@/shared/ui/StatCard';
import { formatPercent } from '@/shared/lib/format';
import { CHART_COLORS } from '@/shared/config/chartColors';
import { Money } from '@/shared/ui/Money';
import { PrivacyChartTooltip, PrivacyYAxisTick } from '@/shared/ui/PrivacyChart';
import { useFinanceStore } from '@/store/useFinanceStore';

export function AnalyticsPage() {
  const theme = useTheme();
  const analytics = useFinanceStore((s) => s.analytics);
  const loading = useFinanceStore((s) => s.loading);
  const fetchAnalytics = useFinanceStore((s) => s.fetchAnalytics);

  useEffect(() => {
    if (!analytics) fetchAnalytics();
  }, [analytics, fetchAnalytics]);

  if (!analytics && loading) {
    return (
      <>
        <PageHeader title="Аналитика" subtitle="Детальный анализ ваших финансов" />
        <Grid container spacing={2}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={120} />
            </Grid>
          ))}
        </Grid>
      </>
    );
  }

  const data = analytics;

  return (
    <>
      <PageHeader title="Аналитика" subtitle="Детальный анализ ваших финансов" />

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Средний расход в день"
            value={data ? <Money amount={data.avgDailyExpense} /> : '—'}
            color="#6366f1"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Средний расход в месяц"
            value={data ? <Money amount={data.avgMonthlyExpense} /> : '—'}
            color="#8b5cf6"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Топ категорий"
            value={data?.topCategories[0]?.category || '—'}
            subtitle={data?.topCategories[0] ? <Money amount={data.topCategories[0].total} /> : undefined}
            color="#ec4899"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Самая дорогая покупка"
            value={data?.topExpenses[0] ? <Money amount={data.topExpenses[0].amount} /> : '—'}
            subtitle={data?.topExpenses[0]?.category}
            color="#f97316"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <Card className="fade-in">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Сравнение месяцев
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.monthComparison || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={<PrivacyYAxisTick />} />
                  <Tooltip content={<PrivacyChartTooltip />} />
                  <Legend />
                  <Bar dataKey="income" fill="#22c55e" name="Доход" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#ef4444" name="Расход" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="fade-in">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Топ категорий
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.topCategories.slice(0, 6) || []}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ category, percentage }) => `${category} ${percentage}%`}
                  >
                    {(data?.topCategories || []).map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PrivacyChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card className="fade-in">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Накопленная статистика
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.cumulativeStats || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" />
                  <YAxis tick={<PrivacyYAxisTick />} />
                  <Tooltip content={<PrivacyChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="totalIncome" stroke="#22c55e" name="Доход" strokeWidth={2} />
                  <Line type="monotone" dataKey="totalExpense" stroke="#ef4444" name="Расход" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="fade-in">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Рост и снижение категорий
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Категория</TableCell>
                    <TableCell align="right">Текущий</TableCell>
                    <TableCell align="right">Прошлый</TableCell>
                    <TableCell align="right">Изменение</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.categoryGrowth || []).slice(0, 8).map((row) => (
                    <TableRow key={row.category}>
                      <TableCell>{row.category}</TableCell>
                      <TableCell align="right">
                        <Money amount={row.current} />
                      </TableCell>
                      <TableCell align="right">
                        <Money amount={row.previous} />
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={formatPercent(row.changePercent)}
                          size="small"
                          color={row.changePercent > 0 ? 'error' : row.changePercent < 0 ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card className="fade-in">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Самые дорогие покупки
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Дата</TableCell>
                    <TableCell>Категория</TableCell>
                    <TableCell>Комментарий</TableCell>
                    <TableCell align="right">Сумма</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(data?.topExpenses || []).slice(0, 8).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{t.date}</TableCell>
                      <TableCell>{t.category}</TableCell>
                      <TableCell>{t.comment || '—'}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        <Money amount={t.amount} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
