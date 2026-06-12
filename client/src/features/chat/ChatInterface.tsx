import { useRef, useEffect, useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Paper,
  Typography,
  Chip,
  CircularProgress,
  Avatar,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import dayjs from 'dayjs';
import { PrivateText } from '@/shared/ui/PrivateText';
import { useChatStore, SUGGESTED_QUESTIONS } from '@/store/useChatStore';

export function ChatInterface() {
  const { messages, loading, sendMessage } = useChatStore();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: 400 }}>
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2, px: 1 }}>
        {messages.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <SmartToyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Задайте вопрос о ваших финансах
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              AI проанализирует ваши данные и даст персональный ответ
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {SUGGESTED_QUESTIONS.map((q) => (
                <Chip
                  key={q}
                  label={q}
                  onClick={() => sendMessage(q)}
                  clickable
                  variant="outlined"
                  color="primary"
                />
              ))}
            </Box>
          </Box>
        )}

        {messages.map((msg) => (
          <Box
            key={msg.id}
            sx={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
            className="fade-in"
          >
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                maxWidth: '80%',
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
              }}
            >
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'secondary.main',
                }}
              >
                {msg.role === 'user' ? <PersonIcon fontSize="small" /> : <SmartToyIcon fontSize="small" />}
              </Avatar>
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  bgcolor: msg.role === 'user' ? 'primary.main' : 'background.paper',
                  color: msg.role === 'user' ? 'white' : 'text.primary',
                  border: msg.role === 'assistant' ? 1 : 0,
                  borderColor: 'divider',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  <PrivateText>{msg.content}</PrivateText>
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.7, display: 'block', mt: 0.5, textAlign: msg.role === 'user' ? 'right' : 'left' }}
                >
                  {dayjs(msg.timestamp).format('HH:mm')}
                </Typography>
              </Paper>
            </Box>
          </Box>
        ))}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 5 }}>
            <CircularProgress size={20} />
            <Typography variant="body2" color="text.secondary">
              Анализирую данные...
            </Typography>
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      <Paper
        elevation={2}
        sx={{
          p: 1,
          display: 'flex',
          gap: 1,
          alignItems: 'flex-end',
          borderRadius: 3,
        }}
      >
        <TextField
          fullWidth
          multiline
          maxRows={4}
          placeholder="Спросите о своих финансах..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          variant="standard"
          InputProps={{ disableUnderline: true, sx: { px: 1 } }}
        />
        <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || loading}>
          <SendIcon />
        </IconButton>
      </Paper>
    </Box>
  );
}
