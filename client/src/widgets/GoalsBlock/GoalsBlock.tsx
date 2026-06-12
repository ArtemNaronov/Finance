import {
  Box,
  Button,
  Card,
  CardContent,
  LinearProgress,
  Typography,
  Chip,
} from '@mui/material';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import { formatMoney } from '@/shared/lib/format';
import { PrivateText } from '@/shared/ui/PrivateText';
import type { GoalWithStats } from '@/types';

interface GoalsBlockProps {
  goals: GoalWithStats[];
  layout?: 'column' | 'grid';
}

export function GoalsBlock({ goals, layout = 'grid' }: GoalsBlockProps) {
  const navigate = useNavigate();
  const preview = goals.slice(0, 3);

  if (goals.length === 0) {
    return (
      <Card className="fade-in" sx={{ width: '100%', height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SavingsIcon color="primary" />
            <Typography variant="h6">Копилки и цели</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Создайте копилку или укажите кредит — накопления не будут считаться расходами
          </Typography>
          <Button variant="outlined" onClick={() => navigate('/goals')}>
            Создать цель
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fade-in" sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SavingsIcon color="primary" />
            <Typography variant="h6">Копилки и цели</Typography>
          </Box>
          <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/goals')}>
            Все цели
          </Button>
        </Box>
        <Box
          sx={{
            display: layout === 'column' ? 'flex' : 'grid',
            flexDirection: layout === 'column' ? 'column' : undefined,
            gridTemplateColumns:
              layout === 'grid'
                ? { xs: '1fr', sm: 'repeat(auto-fit, minmax(220px, 1fr))' }
                : undefined,
            gap: 2,
            flex: 1,
            minHeight: 0,
            alignContent: 'start',
            ...(layout === 'column' && { overflowY: 'auto' }),
          }}
        >
          {preview.map((goal) => (
            <Box
              key={goal.id}
              sx={{
                p: 2,
                borderRadius: 2,
                border: 1,
                borderColor: 'divider',
                height: '100%',
                minWidth: 0,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                {goal.type === 'savings' ? (
                  <SavingsIcon fontSize="small" color="success" />
                ) : (
                  <CreditCardIcon fontSize="small" color="warning" />
                )}
                <Typography variant="subtitle2" fontWeight={600} noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {goal.name}
                </Typography>
                <Chip
                  label={goal.type === 'savings' ? 'Копилка' : 'Кредит'}
                  size="small"
                  color={goal.type === 'savings' ? 'success' : 'warning'}
                  variant="outlined"
                />
              </Box>
              <LinearProgress
                variant="determinate"
                value={goal.progressPercent}
                sx={{ mb: 1, height: 8, borderRadius: 4 }}
                color={goal.type === 'savings' ? 'success' : 'warning'}
              />
              <Typography variant="body2" color="text.secondary">
                {goal.type === 'savings' ? (
                  <PrivateText>
                    {`${formatMoney(goal.currentAmount)} / ${formatMoney(goal.targetAmount)}`}
                  </PrivateText>
                ) : (
                  <PrivateText>{`Остаток: ${formatMoney(goal.currentAmount)}`}</PrivateText>
                )}
              </Typography>
              <Typography variant="caption" color="primary" display="block" sx={{ mt: 0.5 }}>
                <PrivateText>
                  {`Рекомендуемый платёж: ${formatMoney(goal.recommendedMonthlyPayment)}/мес`}
                </PrivateText>
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
