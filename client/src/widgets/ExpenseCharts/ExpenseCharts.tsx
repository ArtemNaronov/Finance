import { Card, CardContent, Typography, Grid, useTheme } from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import dayjs from 'dayjs';
import { CHART_COLORS } from '@/shared/config/chartColors';
import { PrivacyChartTooltip, PrivacyYAxisTick } from '@/shared/ui/PrivacyChart';
import type { MonthStats } from '@/types';

interface ExpenseChartsProps {
  current: MonthStats | null;
  monthly: MonthStats[];
}

export function ExpenseCharts({ current, monthly }: ExpenseChartsProps) {
  const theme = useTheme();
  const textColor = theme.palette.text.secondary;

  const pieData = current?.byCategory.slice(0, 8).map((c) => ({
    name: c.category,
    value: c.total,
  })) || [];

  const dayData = current?.byDay.map((d) => ({
    date: dayjs(d.date).format('D MMM'),
    amount: d.amount,
  })) || [];

  const monthData = monthly.map((m) => ({
    month: dayjs(`${m.year}-${m.month}-01`).format('MMM'),
    income: m.income,
    expense: m.expense,
  }));

  return (
    <Grid container spacing={2} sx={{ mt: 1 }}>
      <Grid item xs={12} md={4}>
        <Card className="fade-in" sx={{ height: 360 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Расходы по категориям
            </Typography>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PrivacyChartTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                Нет данных
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card className="fade-in" sx={{ height: 360 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Расходы по дням
            </Typography>
            {dayData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={dayData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="date" tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis tick={<PrivacyYAxisTick fill={textColor} />} />
                  <Tooltip content={<PrivacyChartTooltip />} />
                  <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                Нет данных
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card className="fade-in" sx={{ height: 360 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Динамика по месяцам
            </Typography>
            {monthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="month" tick={{ fill: textColor, fontSize: 11 }} />
                  <YAxis tick={<PrivacyYAxisTick fill={textColor} />} />
                  <Tooltip content={<PrivacyChartTooltip />} />
                  <Legend />
                  <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} name="Доход" dot={false} />
                  <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} name="Расход" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 8, textAlign: 'center' }}>
                Нет данных
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
