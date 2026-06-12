import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  List,
  ListItemButton,
  ListItemText,
  InputAdornment,
  CircularProgress,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useNavigate } from 'react-router-dom';
import { searchApi } from '@/api';
import type { Transaction } from '@/types';
import { formatDate, formatMoney } from '@/shared/lib/format';

interface GlobalSearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function GlobalSearchDialog({ open, onClose }: GlobalSearchDialogProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setTransactions([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !query.trim()) {
      if (!query.trim()) setTransactions([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const result = await searchApi.search(query.trim());
        setTransactions(result.transactions);
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [open, query]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Поиск</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          placeholder="Категория, комментарий, сумма..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />
        {loading && (
          <Typography align="center" py={2}>
            <CircularProgress size={24} />
          </Typography>
        )}
        {!loading && query && transactions.length === 0 && (
          <Typography color="text.secondary">Ничего не найдено</Typography>
        )}
        <List dense>
          {transactions.map((t) => (
            <ListItemButton
              key={t.id}
              onClick={() => {
                onClose();
                navigate('/transactions');
              }}
            >
              <ListItemText
                primary={`${t.category} — ${formatMoney(t.amount)}`}
                secondary={`${formatDate(t.date)}${t.comment ? ` · ${t.comment}` : ''}`}
              />
            </ListItemButton>
          ))}
        </List>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          Ctrl+K — открыть поиск · N — новая операция
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
