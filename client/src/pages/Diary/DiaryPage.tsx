import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Box,
  Divider,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { PageHeader } from '@/shared/ui/PageHeader';
import { EmptyState } from '@/shared/ui/EmptyState';
import { PrivateText } from '@/shared/ui/PrivateText';
import { useFinanceStore } from '@/store/useFinanceStore';
import { reportsApi } from '@/api';

dayjs.locale('ru');

export function DiaryPage() {
  const reports = useFinanceStore((s) => s.reports);
  const fetchReports = useFinanceStore((s) => s.fetchReports);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await reportsApi.generate();
      await fetchReports();
    } finally {
      setGenerating(false);
    }
  };

  const monthName = (month: number, year: number) =>
    dayjs(`${year}-${month}-01`).format('MMMM YYYY');

  return (
    <>
      <PageHeader
        title="Финансовый дневник"
        subtitle="AI-отчёты по месяцам с резюме и рекомендациями"
        action={
          <Button
            variant="outlined"
            startIcon={generating ? <CircularProgress size={18} /> : <AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={generating}
          >
            Сгенерировать отчёт
          </Button>
        }
      />

      {reports.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<MenuBookIcon sx={{ fontSize: 64 }} />}
              title="Отчётов пока нет"
              description="Нажмите «Сгенерировать отчёт» для создания AI-отчёта за прошлый месяц"
            />
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {reports.map((report) => (
            <Grid item xs={12} md={6} key={report.id}>
              <Card className="fade-in" sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <MenuBookIcon color="primary" />
                    <Typography variant="h6">
                      {monthName(report.month, report.year)}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Создан: {dayjs(report.createdAt).format('D MMMM YYYY, HH:mm')}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" gutterBottom color="primary">
                    Резюме
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    <PrivateText>{report.summary}</PrivateText>
                  </Typography>
                  {report.recommendations && (
                    <>
                      <Typography variant="subtitle2" gutterBottom color="secondary">
                        Рекомендации
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        <PrivateText>{report.recommendations}</PrivateText>
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}
