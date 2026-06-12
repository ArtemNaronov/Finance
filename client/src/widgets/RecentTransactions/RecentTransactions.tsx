import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '@/shared/lib/format';
import { TransactionAmountCell } from '@/shared/ui/TransactionAmountCell';
import type { Transaction } from '@/types';

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const navigate = useNavigate();
  const recent = transactions.slice(0, 5);

  return (
    <Card className="fade-in" sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Последние операции</Typography>
          <Button size="small" onClick={() => navigate('/transactions')}>
            Все операции
          </Button>
        </Box>
        {recent.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography color="text.secondary">Операций пока нет</Typography>
          </Box>
        ) : (
          <Table size="small" sx={{ flex: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Категория</TableCell>
                <TableCell align="right">Сумма</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recent.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell>{formatDate(t.date)}</TableCell>
                  <TableCell>
                    <Chip
                      label={t.type === 'income' ? 'Доход' : 'Расход'}
                      size="small"
                      color={t.type === 'income' ? 'success' : 'error'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TransactionAmountCell type={t.type} amount={t.amount} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
