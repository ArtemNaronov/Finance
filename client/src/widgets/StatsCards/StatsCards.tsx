import { Box } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import SavingsIcon from '@mui/icons-material/Savings';
import { StatCard } from '@/shared/ui/StatCard';
import { Money } from '@/shared/ui/Money';
import { PrivateText } from '@/shared/ui/PrivateText';
import { formatMoney } from '@/shared/lib/format';
import type { MonthStats } from '@/types';

interface StatsCardsProps {
  stats: MonthStats | null;
  loading?: boolean;
}

function buildPiggySubtitle(stats: MonthStats): string | undefined {
  if (!stats.piggyDeposits) return undefined;
  const parts: string[] = [];
  if (stats.goalDeposits > 0) parts.push(`пополнения ${formatMoney(stats.goalDeposits)}`);
  if (stats.piggyTransfers > 0) parts.push(`переводы ${formatMoney(stats.piggyTransfers)}`);
  return `за месяц: ${formatMoney(stats.piggyDeposits)}${parts.length ? ` (${parts.join(', ')})` : ''}`;
}

function buildBalanceSubtitle(stats: MonthStats): string {
  const parts: string[] = [];
  if (stats.piggyDeposits > 0) parts.push(`копилки −${formatMoney(stats.piggyDeposits)}`);
  if (stats.creditPayments > 0) parts.push(`кредиты −${formatMoney(stats.creditPayments)}`);
  if (parts.length === 0) return 'доходы − расходы − копилки − кредиты';
  return `за вычетом ${parts.join(', ')}`;
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  const piggySubtitle = stats
    ? [
        stats.totalInSavingsGoals > 0 ? 'всего накоплено' : undefined,
        buildPiggySubtitle(stats),
      ]
        .filter(Boolean)
        .join(' · ') || undefined
    : undefined;

  const balanceSubtitle = stats ? buildBalanceSubtitle(stats) : 'доходы − расходы − копилки − кредиты';

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          md: 'repeat(3, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 2,
      }}
    >
      <StatCard
        title="Доходы за месяц"
        value={stats ? <Money amount={stats.income} /> : '—'}
        icon={<TrendingUpIcon />}
        color="#22c55e"
        loading={loading}
      />
      <StatCard
        title="Расходы за месяц"
        value={stats ? <Money amount={stats.expense} /> : '—'}
        subtitle="без копилок и кредитов"
        icon={<TrendingDownIcon />}
        color="#ef4444"
        loading={loading}
      />
      <StatCard
        title="Накоплено в копилках"
        value={stats ? <Money amount={stats.totalInSavingsGoals ?? 0} /> : '—'}
        subtitle={piggySubtitle ? <PrivateText>{piggySubtitle}</PrivateText> : undefined}
        icon={<SavingsIcon />}
        color="#22c55e"
        loading={loading}
      />
      <StatCard
        title="Свободный остаток"
        value={stats ? <Money amount={stats.balance} /> : '—'}
        subtitle={<PrivateText>{balanceSubtitle}</PrivateText>}
        icon={<AccountBalanceIcon />}
        color={stats && stats.balance >= 0 ? '#6366f1' : '#ef4444'}
        loading={loading}
      />
      <StatCard
        title="Операций"
        value={stats ? String(stats.transactionCount) : '—'}
        icon={<ReceiptIcon />}
        color="#8b5cf6"
        loading={loading}
      />
    </Box>
  );
}
