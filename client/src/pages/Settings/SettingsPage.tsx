import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { PageHeader } from '@/shared/ui/PageHeader';
import { dataApi, versionApi } from '@/api';
import { useFinanceStore } from '@/store/useFinanceStore';

export function SettingsPage() {
  const [version, setVersion] = useState('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const csvRef = useRef<HTMLInputElement>(null);
  const refreshAll = useFinanceStore((s) => s.refreshAll);

  useEffect(() => {
    versionApi.get().then((v) => setVersion(v.version)).catch(() => setVersion('—'));
  }, []);

  const handleExport = async () => {
    const blob = await dataApi.exportJson();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finance-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const result = await dataApi.importJson(data, importMode);
      setMessage({ type: 'success', text: `Импортировано: ${JSON.stringify(result.imported)}` });
      await refreshAll();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Ошибка импорта' });
    }
  };

  const handleImportCsv = async (file: File) => {
    try {
      const content = await file.text();
      const result = await dataApi.importBankCsv(content);
      setMessage({
        type: 'success',
        text: `Импортировано операций: ${result.created}${result.errors?.length ? `. Предупреждения: ${result.errors.length}` : ''}`,
      });
      await refreshAll();
    } catch (e) {
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Ошибка импорта CSV' });
    }
  };

  return (
    <>
      <PageHeader title="Настройки" subtitle={`Версия приложения: ${version}`} />

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Резервное копирование
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Экспорт и импорт всех данных: операции, копилки, бюджеты, повторяющиеся шаблоны.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleExport}>
              Экспорт JSON
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileRef.current?.click()}>
              Импорт JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJson(f);
                e.target.value = '';
              }}
            />
          </Box>
          <RadioGroup row value={importMode} onChange={(_, v) => setImportMode(v as 'merge' | 'replace')}>
            <FormControlLabel value="merge" control={<Radio />} label="Объединить с существующими" />
            <FormControlLabel value="replace" control={<Radio />} label="Заменить все данные" />
          </RadioGroup>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Импорт из банка (CSV)
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Колонки: дата, сумма, описание. Разделитель — запятая или точка с запятой.
          </Typography>
          <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => csvRef.current?.click()}>
            Загрузить CSV
          </Button>
          <input
            ref={csvRef}
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportCsv(f);
              e.target.value = '';
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Платформы
          </Typography>
          <Typography color="text.secondary" paragraph>
            Приложение работает как PWA в браузере, как десктоп (Tauri) и как мобильное (Capacitor).
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            • Windows / macOS: <code>npm run tauri:dev</code> или Docker<br />
            • iOS / Android: <code>npm run cap:sync</code> после сборки<br />
            • Мобильный клиент: задайте <code>VITE_API_URL</code> на адрес сервера
          </Typography>
        </CardContent>
      </Card>
    </>
  );
}
