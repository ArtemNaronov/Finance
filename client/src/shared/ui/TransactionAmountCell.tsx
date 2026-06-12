import { TableCell } from '@mui/material';
import { Money } from '@/shared/ui/Money';
import type { TransactionType } from '@/types';

interface TransactionAmountCellProps {
  type: TransactionType;
  amount: number;
}

export function TransactionAmountCell({ type, amount }: TransactionAmountCellProps) {
  return (
    <TableCell
      align="right"
      sx={{ color: type === 'income' ? 'success.main' : 'error.main', fontWeight: 600 }}
    >
      <Money amount={amount} sign={type === 'income' ? '+' : '−'} />
    </TableCell>
  );
}
