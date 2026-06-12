import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TransactionTable } from '@/features/transaction-table/TransactionTable';
import { useFinanceStore } from '@/store/useFinanceStore';

export function TransactionsPage() {
  const navigate = useNavigate();
  const transactions = useFinanceStore((s) => s.transactions);
  const updateTransaction = useFinanceStore((s) => s.updateTransaction);
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction);

  const duplicateTransaction = useFinanceStore((s) => s.duplicateTransaction);

  return (
    <>
      <PageHeader
        title="Операции"
        subtitle={`Всего операций: ${transactions.length}`}
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/add')}>
            Добавить
          </Button>
        }
      />
      <TransactionTable
        transactions={transactions}
        onUpdate={updateTransaction}
        onDelete={deleteTransaction}
        onDuplicate={duplicateTransaction}
      />
    </>
  );
}
