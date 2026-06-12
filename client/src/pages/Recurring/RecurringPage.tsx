import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { PageHeader } from '@/shared/ui/PageHeader';
import { Money } from '@/shared/ui/Money';
import { recurringApi } from '@/api';
import { useFinanceStore } from '@/store/useFinanceStore';
import type { RecurringTransaction, TransactionType } from '@/types';

export function RecurringPage() {
  const [items, setItems] = useState<RecurringTransaction[]>([]);
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [comment, setComment] = useState('');
  const categories = useFinanceStore((s) => s.categories);

  const load = () => recurringApi.getAll().then(setItems);

  useEffect(() => {
    load();
    useFinanceStore.getState().fetchCategories();
  }, []);

  const typeCategories =
    type === 'income'
      ? (categories?.income ?? [])
      : [...(categories?.expense ?? []), ...(categories?.transfer ?? [])];

  const handleCreate = async () => {
    if (!category || !amount) return;
    await recurringApi.create({
      type,
      amount: Number(amount),
      category,
      comment,
      dayOfMonth: Number(dayOfMonth) || 1,
    });
    setAmount('');
    setComment('');
    await load();
  };

  return (
    <>
      <PageHeader title="Повторяющиеся операции" subtitle="Автоматически создаются в указанный день месяца" />

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Тип</InputLabel>
            <Select value={type} label="Тип" onChange={(e) => setType(e.target.value as TransactionType)}>
              <MenuItem value="expense">Расход</MenuItem>
              <MenuItem value="income">Доход</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Категория</InputLabel>
            <Select value={category} label="Категория" onChange={(e) => setCategory(e.target.value)}>
              {typeCategories.map((c) => (
                <MenuItem key={c} value={c}>
                  {c}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField size="small" label="Сумма" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <TextField size="small" label="День месяца" type="number" value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} sx={{ width: 120 }} />
          <TextField size="small" label="Комментарий" value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button variant="contained" onClick={handleCreate}>
            Добавить
          </Button>
        </CardContent>
      </Card>

      <Box sx={{ display: 'grid', gap: 2 }}>
        {items.map((r) => (
          <Card key={r.id}>
            <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography fontWeight={600}>
                  {r.category} — <Money amount={r.amount} />
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {r.type === 'income' ? 'Доход' : 'Расход'} · {r.dayOfMonth}-е число
                  {r.comment ? ` · ${r.comment}` : ''}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={r.active ? 'Активен' : 'Выключен'} size="small" color={r.active ? 'success' : 'default'} />
                <Switch
                  checked={r.active}
                  onChange={async (_, checked) => {
                    await recurringApi.update(r.id, { active: checked });
                    await load();
                  }}
                />
                <IconButton color="error" onClick={async () => { await recurringApi.delete(r.id); await load(); }}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && <Typography color="text.secondary">Повторяющихся операций пока нет</Typography>}
      </Box>
    </>
  );
}
