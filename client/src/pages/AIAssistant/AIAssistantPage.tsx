import { Card, CardContent } from '@mui/material';
import { PageHeader } from '@/shared/ui/PageHeader';
import { ChatInterface } from '@/features/chat/ChatInterface';

export function AIAssistantPage() {
  return (
    <>
      <PageHeader
        title="AI-Помощник"
        subtitle="Задавайте вопросы о своих финансах — ответы основаны на ваших реальных данных"
      />
      <Card className="fade-in">
        <CardContent>
          <ChatInterface />
        </CardContent>
      </Card>
    </>
  );
}
