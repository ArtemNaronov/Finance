import { useMemo, useState } from 'react';
import {
  Box,
  Chip,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SearchIcon from '@mui/icons-material/Search';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';
import { TransactionForm } from '@/features/transaction-form/TransactionForm';
import { formatDate } from '@/shared/lib/format';
import { TransactionAmountCell } from '@/shared/ui/TransactionAmountCell';
import type { Transaction } from '@/types';

type SortField = 'date' | 'amount' | 'category';
type SortOrder = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, data: Partial<Transaction>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
}

export function TransactionTable({ transactions, onUpdate, onDelete, onDuplicate }: TransactionTableProps) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<Dayjs | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [editing, setEditing] = useState<Transaction | null>(null);

  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions],
  );

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.category.toLowerCase().includes(q) ||
          t.comment.toLowerCase().includes(q) ||
          String(t.amount).includes(q),
      );
    }

    if (categoryFilter) {
      result = result.filter((t) => t.category === categoryFilter);
    }

    if (dateFrom) {
      result = result.filter((t) => t.date >= dateFrom.format('YYYY-MM-DD'));
    }

    if (dateTo) {
      result = result.filter((t) => t.date <= dateTo.format('YYYY-MM-DD'));
    }

    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = a.date.localeCompare(b.date);
      else if (sortField === 'amount') cmp = a.amount - b.amount;
      else cmp = a.category.localeCompare(b.category);
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [transactions, search, categoryFilter, dateFrom, dateTo, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Поиск..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: 200 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Категория</InputLabel>
          <Select
            value={categoryFilter}
            label="Категория"
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <MenuItem value="">Все</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <DatePicker
          label="С"
          value={dateFrom}
          onChange={setDateFrom}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
        <DatePicker
          label="По"
          value={dateTo}
          onChange={setDateTo}
          slotProps={{ textField: { size: 'small', sx: { width: 150 } } }}
        />
      </Box>

      <TableContainer component={Paper} className="fade-in">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'date'}
                  direction={sortField === 'date' ? sortOrder : 'asc'}
                  onClick={() => handleSort('date')}
                >
                  Дата
                </TableSortLabel>
              </TableCell>
              <TableCell>Тип</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'category'}
                  direction={sortField === 'category' ? sortOrder : 'asc'}
                  onClick={() => handleSort('category')}
                >
                  Категория
                </TableSortLabel>
              </TableCell>
              <TableCell align="right">
                <TableSortLabel
                  active={sortField === 'amount'}
                  direction={sortField === 'amount' ? sortOrder : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  Сумма
                </TableSortLabel>
              </TableCell>
              <TableCell>Комментарий</TableCell>
              <TableCell align="right">Действия</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((t) => (
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
                <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.comment || '—'}
                </TableCell>
                <TableCell align="right">
                  {onDuplicate && (
                    <IconButton size="small" onClick={() => onDuplicate(t.id)} title="Дублировать">
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton size="small" onClick={() => setEditing(t)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      if (confirm('Удалить операцию?')) onDelete(t.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Операции не найдены
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editing} onClose={() => setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Редактировать операцию</DialogTitle>
        <DialogContent>
          {editing && (
            <TransactionForm
              key={editing.id}
              initial={editing}
              onSubmit={async (data) => {
                await onUpdate(editing.id, data);
                setEditing(null);
              }}
              onCancel={() => setEditing(null)}
              submitLabel="Обновить"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
