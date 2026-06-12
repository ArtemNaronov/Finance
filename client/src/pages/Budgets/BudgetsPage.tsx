import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  TextField,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { PageHeader } from '@/shared/ui/PageHeader';
import { MonthPicker } from '@/shared/ui/MonthPicker';
import { Money } from '@/shared/ui/Money';
import { budgetsApi } from '@/api';
import { useFinanceStore } from '@/store/useFinanceStore';
import type { BudgetStatus } from '@/types';

export function BudgetsPage() {
  const now = dayjs();
  const [month, setMonth] = useState(now.month() + 1);
  const [year, setYear] = useState(now.year());
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [category, setCategory] = useState('');
  const [limit, setLimit] = useState('');
  const categories = useFinanceStore((s) => s.categories);

  const load = async (m: number, y: number) => {
    const data = await budgetsApi.getStatus(m, y);
    setBudgets(data);
  };

  useEffect(() => {
    load(month, year);
    useFinanceStore.getState().fetchCategories();
  }, [month, year]);

  const expenseCategories = categories?.expense ?? [];

  const handleAdd = async () => {
    if (!category || !limit) return;
    await budgetsApi.set({
      category,
      month,
      year,
      limitAmount: Number(limit),
    });
    setCategory('');
    setLimit('');
    await load(month, year);
  };

  return (
    <>
      <PageHeader
        title="Бюджеты"
        subtitle="Лимиты расходов по категориям"
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <MonthPicker
              month={month}
              year={year}
              onChange={(m, y) => {
                setMonth(m);
                setYear(y);
                load(m, y);
              }}
            />
          </Box>
        }
      />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Категория</InputLabel>
            <Select value={category} label="Категория" onChange={(e) => setCategory(e.target.value)}>
              {expenseCategories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            size="small"
            label="Лимит, ₽"
            type="number"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
          <Button variant="contained" onClick={handleAdd}>
            Добавить
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {budgets.map((b) => (
          <Card key={b.id}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight={600}>{b.category}</Typography>
                <IconButton
                  size="small"
                  color="error"
                  onClick={async () => {
                    await budgetsApi.delete(b.id);
                    await load(month, year);
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                <Money amount={b.spent} /> из <Money amount={b.limitAmount} />
              </Typography>
              <LinearProgress
                variant="determinate"
                value={b.percentUsed}
                color={b.overBudget ? 'error' : b.percentUsed > 80 ? 'warning' : 'primary'}
              />
              {b.overBudget && (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  Превышен лимит на <Money amount={Math.abs(b.remaining)} />
                </Alert>
              )}
            </CardContent>
          </Card>
        ))}
        {budgets.length === 0 && (
          <Typography color="text.secondary">Бюджеты на этот месяц не заданы</Typography>
        )}
      </Box>
    </>
  );
}
