import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  LinearProgress,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import DeleteIcon from '@mui/icons-material/Delete';
import ArchiveIcon from '@mui/icons-material/Archive';
import EditIcon from '@mui/icons-material/Edit';
import PaymentIcon from '@mui/icons-material/Payment';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { PageHeader } from '@/shared/ui/PageHeader';
import { GoalFormDialog } from '@/features/goal-form/GoalFormDialog';
import { Money } from '@/shared/ui/Money';
import { PrivateText } from '@/shared/ui/PrivateText';
import { formatMoney } from '@/shared/lib/format';
import { useFinanceStore } from '@/store/useFinanceStore';
import type { GoalWithStats } from '@/types';

export function GoalsPage() {
  const goals = useFinanceStore((s) => s.goals);
  const goalsLoading = useFinanceStore((s) => s.goalsLoading);
  const fetchGoals = useFinanceStore((s) => s.fetchGoals);
  const createGoal = useFinanceStore((s) => s.createGoal);
  const updateGoal = useFinanceStore((s) => s.updateGoal);
  const deleteGoal = useFinanceStore((s) => s.deleteGoal);
  const contributeToGoal = useFinanceStore((s) => s.contributeToGoal);
  const archiveGoal = useFinanceStore((s) => s.archiveGoal);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingGoal, setEditingGoal] = useState<GoalWithStats | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);

  const [contribAmount, setContribAmount] = useState('');
  const [contribDate, setContribDate] = useState<Dayjs | null>(dayjs());
  const [contribComment, setContribComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (goals.length === 0) fetchGoals();
  }, [fetchGoals, goals.length]);

  const openCreate = () => {
    setFormMode('create');
    setEditingGoal(null);
    setFormOpen(true);
  };

  const openEdit = (goal: GoalWithStats) => {
    setFormMode('edit');
    setEditingGoal(goal);
    setFormOpen(true);
  };

  const handleFormSubmit = async (
    values: Parameters<typeof createGoal>[0] & { currentAmount?: number },
  ) => {
    if (formMode === 'create') {
      await createGoal(values);
    } else if (editingGoal) {
      await updateGoal(editingGoal.id, {
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: values.currentAmount,
        monthlyPayment: values.monthlyPayment ?? 0,
        interestRate: values.interestRate ?? 0,
        deadline: values.deadline ?? null,
      });
    }
  };

  const handleContribute = async () => {
    if (!contributeGoalId) return;
    setSubmitting(true);
    try {
      await contributeToGoal(contributeGoalId, {
        amount: Number(contribAmount),
        date: contribDate!.format('YYYY-MM-DD'),
        comment: contribComment,
      });
      setContributeGoalId(null);
      setContribAmount('');
      setContribComment('');
    } finally {
      setSubmitting(false);
    }
  };

  const activeGoal = goals.find((g) => g.id === contributeGoalId);

  return (
    <>
      <PageHeader
        title="Копилки и цели"
        subtitle="Накопления и кредиты учитываются отдельно — AI не будет советовать их сокращать"
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            Новая цель
          </Button>
        }
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Пополняйте копилки здесь, а не через «Расходы». Нажмите карандаш, чтобы изменить название,
        цель или текущую сумму.
      </Alert>

      {goalsLoading && goals.length === 0 ? (
        <LinearProgress />
      ) : goals.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SavingsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Пока нет целей
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Создайте копилку с целевой суммой или добавьте кредит для расчёта платежа
            </Typography>
            <Button variant="contained" onClick={openCreate}>
              Создать первую цель
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {goals.map((goal) => (
            <Grid item xs={12} md={6} key={goal.id}>
              <Card className="fade-in" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                      {goal.type === 'savings' ? (
                        <SavingsIcon color="success" />
                      ) : (
                        <CreditCardIcon color="warning" />
                      )}
                      <Typography variant="h6">{goal.name}</Typography>
                      <Chip
                        size="small"
                        label={goal.type === 'savings' ? 'Копилка' : 'Кредит'}
                        color={goal.type === 'savings' ? 'success' : 'warning'}
                        variant="outlined"
                      />
                    </Box>
                    <Box>
                      <IconButton size="small" onClick={() => openEdit(goal)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Архивировать"
                        onClick={() => {
                          if (confirm('Архивировать цель? Она скроется с дашборда.')) archiveGoal(goal.id);
                        }}
                      >
                        <ArchiveIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => {
                          if (confirm('Удалить цель?')) deleteGoal(goal.id);
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <LinearProgress
                    variant="determinate"
                    value={goal.progressPercent}
                    sx={{ mb: 2, height: 10, borderRadius: 5 }}
                    color={goal.type === 'savings' ? 'success' : 'warning'}
                  />

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {goal.type === 'savings' ? 'Накоплено' : 'Остаток долга'}
                      </Typography>
                      <Typography fontWeight={600}>
                        <Money amount={goal.currentAmount} />
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        {goal.type === 'savings' ? 'Цель' : 'Сумма кредита'}
                      </Typography>
                      <Typography fontWeight={600}>
                        <Money amount={goal.targetAmount} />
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Прогресс
                      </Typography>
                      <Typography fontWeight={600}>{goal.progressPercent}%</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">
                        Рекомендуемый платёж/мес
                      </Typography>
                      <Typography fontWeight={600} color="primary">
                        <Money amount={goal.recommendedMonthlyPayment} />
                      </Typography>
                    </Grid>
                    {goal.type === 'credit' && goal.interestRate > 0 && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Ставка
                        </Typography>
                        <Typography fontWeight={600}>{goal.interestRate}% годовых</Typography>
                      </Grid>
                    )}
                    {goal.deadline && (
                      <Grid item xs={6}>
                        <Typography variant="caption" color="text.secondary">
                          Срок
                        </Typography>
                        <Typography fontWeight={600}>
                          до {dayjs(goal.deadline).format('D MMM YYYY')}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>

                  <Button
                    variant="contained"
                    fullWidth
                    startIcon={<PaymentIcon />}
                    onClick={() => setContributeGoalId(goal.id)}
                  >
                    {goal.type === 'savings' ? 'Пополнить копилку' : 'Внести платёж'}
                  </Button>

                  {goal.contributions.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Последние операции
                      </Typography>
                      {goal.contributions.slice(0, 3).map((c) => (
                        <Typography key={c.id} variant="body2">
                          {c.date}: <Money amount={c.amount} />
                          {c.comment ? ` — ${c.comment}` : ''}
                        </Typography>
                      ))}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <GoalFormDialog
        open={formOpen}
        mode={formMode}
        goal={editingGoal}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <Dialog
        open={!!contributeGoalId}
        onClose={() => setContributeGoalId(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          {activeGoal?.type === 'savings' ? 'Пополнить копилку' : 'Платёж по кредиту'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {activeGoal && (
            <Alert severity="info" icon={false}>
              <PrivateText>
                {`Рекомендуемый платёж: ${formatMoney(activeGoal.recommendedMonthlyPayment)}`}
              </PrivateText>
            </Alert>
          )}
          <TextField
            label="Сумма"
            type="number"
            value={contribAmount}
            onChange={(e) => setContribAmount(e.target.value)}
            fullWidth
          />
          <DatePicker
            label="Дата"
            value={contribDate}
            onChange={setContribDate}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            label="Комментарий"
            value={contribComment}
            onChange={(e) => setContribComment(e.target.value)}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setContributeGoalId(null)}>Отмена</Button>
          <Button
            variant="contained"
            onClick={handleContribute}
            disabled={submitting || !contribAmount}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
