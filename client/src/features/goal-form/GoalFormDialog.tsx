import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import type { GoalType, GoalWithStats } from '@/types';

export interface GoalFormValues {
  name: string;
  type: GoalType;
  targetAmount: number;
  currentAmount?: number;
  monthlyPayment?: number;
  interestRate?: number;
  deadline?: string;
  initialAmount?: number;
}

interface GoalFormDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  goal?: GoalWithStats | null;
  onClose: () => void;
  onSubmit: (values: GoalFormValues) => Promise<void>;
}

export function GoalFormDialog({ open, mode, goal, onClose, onSubmit }: GoalFormDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<GoalType>('savings');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [deadline, setDeadline] = useState<Dayjs | null>(null);
  const [initialAmount, setInitialAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (mode === 'edit' && goal) {
      setName(goal.name);
      setType(goal.type);
      setTargetAmount(String(goal.targetAmount));
      setCurrentAmount(String(goal.currentAmount));
      setMonthlyPayment(goal.monthlyPayment ? String(goal.monthlyPayment) : '');
      setInterestRate(goal.interestRate ? String(goal.interestRate) : '');
      setDeadline(goal.deadline ? dayjs(goal.deadline) : null);
      setInitialAmount('');
    } else {
      setName('');
      setType('savings');
      setTargetAmount('');
      setCurrentAmount('');
      setMonthlyPayment('');
      setInterestRate('');
      setDeadline(null);
      setInitialAmount('');
    }
  }, [open, mode, goal]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        type,
        targetAmount: Number(targetAmount),
        currentAmount: mode === 'edit' && currentAmount ? Number(currentAmount) : undefined,
        monthlyPayment: monthlyPayment ? Number(monthlyPayment) : undefined,
        interestRate: type === 'credit' && interestRate ? Number(interestRate) : undefined,
        deadline: deadline?.format('YYYY-MM-DD'),
        initialAmount: mode === 'create' && type === 'savings' && initialAmount ? Number(initialAmount) : undefined,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{mode === 'edit' ? 'Редактировать цель' : 'Новая цель'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {mode === 'create' ? (
          <FormControl fullWidth>
            <InputLabel>Тип</InputLabel>
            <Select value={type} label="Тип" onChange={(e) => setType(e.target.value as GoalType)}>
              <MenuItem value="savings">Копилка / накопление</MenuItem>
              <MenuItem value="credit">Кредит</MenuItem>
            </Select>
          </FormControl>
        ) : (
          <TextField
            label="Тип"
            value={type === 'savings' ? 'Копилка / накопление' : 'Кредит'}
            fullWidth
            disabled
          />
        )}

        <TextField label="Название" value={name} onChange={(e) => setName(e.target.value)} fullWidth />

        <TextField
          label={type === 'savings' ? 'Целевая сумма' : 'Сумма кредита'}
          type="number"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          fullWidth
        />

        {mode === 'edit' && (
          <TextField
            label={type === 'savings' ? 'Накоплено' : 'Остаток долга'}
            type="number"
            value={currentAmount}
            onChange={(e) => setCurrentAmount(e.target.value)}
            fullWidth
            helperText="Можно скорректировать вручную"
          />
        )}

        {mode === 'create' && type === 'savings' && (
          <TextField
            label="Уже накоплено (необязательно)"
            type="number"
            value={initialAmount}
            onChange={(e) => setInitialAmount(e.target.value)}
            fullWidth
            helperText="Уже лежит в копилке — не списывается из свободного остатка"
          />
        )}

        {type === 'credit' && (
          <TextField
            label="Процентная ставка (% годовых)"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            fullWidth
          />
        )}

        <TextField
          label="Плановый платёж в месяц (необязательно)"
          type="number"
          value={monthlyPayment}
          onChange={(e) => setMonthlyPayment(e.target.value)}
          fullWidth
          helperText="Если не указать — рассчитаем автоматически"
        />

        <DatePicker
          label="Срок (дедлайн)"
          value={deadline}
          onChange={setDeadline}
          slotProps={{ textField: { fullWidth: true } }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Отмена</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting || !name || !targetAmount}
        >
          {mode === 'edit' ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
