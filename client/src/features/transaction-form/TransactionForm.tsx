import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useFinanceStore } from '@/store/useFinanceStore';
import type { Transaction, TransactionType } from '@/types';

interface TransactionFormProps {
  initial?: Partial<Transaction>;
  onSubmit: (data: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

export function TransactionForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
}: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(initial?.type || 'expense');
  const [amount, setAmount] = useState(String(initial?.amount || ''));
  const [category, setCategory] = useState(initial?.category || '');
  const [date, setDate] = useState<Dayjs | null>(
    initial?.date ? dayjs(initial.date) : dayjs(),
  );
  const [comment, setComment] = useState(initial?.comment || '');
  const fetchCategories = useFinanceStore((s) => s.fetchCategories);
  const [categories, setCategories] = useState<{ income: string[]; expense: string[]; transfer: string[] }>({
    income: [],
    expense: [],
    transfer: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, [fetchCategories]);

  useEffect(() => {
    const validCategories =
      type === 'income'
        ? categories.income
        : [...categories.expense, ...categories.transfer];

    if (validCategories.length && category && !validCategories.includes(category)) {
      setCategory(validCategories[0]);
    }
  }, [type, categories, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Укажите корректную сумму');
      return;
    }
    if (!category || !date) {
      setError('Заполните все обязательные поля');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        type,
        amount: numAmount,
        category,
        date: date.format('YYYY-MM-DD'),
        comment,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  const availableCategories = type === 'income' ? categories.income : categories.expense;
  const isTransfer = type === 'expense' && categories.transfer.includes(category);

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
      {error && <Alert severity="error">{error}</Alert>}
      {isTransfer && (
        <Alert severity="info">
          Это накопление, не расход. Для целей с прогрессом лучше использовать раздел «Копилки».
        </Alert>
      )}

      <ToggleButtonGroup
        value={type}
        exclusive
        onChange={(_, v) => v && setType(v)}
        fullWidth
        color="primary"
      >
        <ToggleButton value="expense" sx={{ py: 1.5 }}>
          Расход
        </ToggleButton>
        <ToggleButton value="income" sx={{ py: 1.5 }}>
          Доход
        </ToggleButton>
      </ToggleButtonGroup>

      <TextField
        label="Сумма"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
        fullWidth
        InputProps={{ inputProps: { min: 0, step: 0.01 } }}
      />

      <FormControl fullWidth required>
        <InputLabel>Категория</InputLabel>
        <Select value={category} label="Категория" onChange={(e) => setCategory(e.target.value)}>
          {availableCategories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {cat}
            </MenuItem>
          ))}
          {type === 'expense' &&
            categories.transfer.map((cat) => (
              <MenuItem key={cat} value={cat} sx={{ color: 'success.main' }}>
                {cat} (накопление)
              </MenuItem>
            ))}
        </Select>
      </FormControl>

      <DatePicker
        label="Дата"
        value={date}
        onChange={setDate}
        slotProps={{ textField: { fullWidth: true, required: true } }}
      />

      <TextField
        label="Комментарий"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        fullWidth
        multiline
        rows={2}
      />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={loading}>
            Отмена
          </Button>
        )}
        <Button type="submit" variant="contained" disabled={loading} sx={{ minWidth: 140 }}>
          {loading ? <CircularProgress size={24} /> : submitLabel}
        </Button>
      </Box>
    </Box>
  );
}
