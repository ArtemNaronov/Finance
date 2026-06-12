import { useState } from 'react';
import { Card, CardContent, Alert, Snackbar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/shared/ui/PageHeader';
import { TransactionForm } from '@/features/transaction-form/TransactionForm';
import { PrivateText } from '@/shared/ui/PrivateText';
import { useFinanceStore } from '@/store/useFinanceStore';

export function AddTransactionPage() {
  const navigate = useNavigate();
  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const fetchInsights = useFinanceStore((s) => s.fetchInsights);
  const [insight, setInsight] = useState<string | null>(null);
  const [showInsight, setShowInsight] = useState(false);

  const pollInsight = async (attempts = 5) => {
    for (let i = 0; i < attempts; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      await fetchInsights();
      const latest = useFinanceStore.getState().insights[0];
      if (latest?.text) {
        setInsight(latest.text);
        return;
      }
    }
    setInsight('AI-инсайт пока не готов — он появится в блоке на дашборде');
  };

  return (
    <>
      <PageHeader
        title="Добавить операцию"
        subtitle="После сохранения автоматически сгенерируется AI-инсайт"
      />
      <Card className="fade-in" sx={{ maxWidth: 560 }}>
        <CardContent sx={{ p: 3 }}>
          <TransactionForm
            onSubmit={async (data) => {
              const result = await addTransaction(data);
              if (result.insight) {
                setInsight(result.insight.text);
                setShowInsight(true);
              } else if (result.insightPending) {
                setInsight('AI-инсайт генерируется...');
                setShowInsight(true);
                void pollInsight();
              }
              setTimeout(() => navigate('/'), 3500);
            }}
            onCancel={() => navigate(-1)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>

      <Snackbar
        open={showInsight}
        autoHideDuration={8000}
        onClose={() => setShowInsight(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={insight?.startsWith('Ошибка') || insight?.startsWith('Укажите') ? 'warning' : 'info'}
          onClose={() => setShowInsight(false)}
          sx={{ width: '100%' }}
        >
          <strong>
            {insight?.startsWith('Ошибка') || insight?.startsWith('Укажите') ? 'AI:' : 'AI-инсайт:'}
          </strong>{' '}
          {insight ? <PrivateText>{insight}</PrivateText> : null}
        </Alert>
      </Snackbar>
    </>
  );
}
