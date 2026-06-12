import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Box } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import dayjs from 'dayjs';
import { PrivateText } from '@/shared/ui/PrivateText';
import type { Insight } from '@/types';

interface InsightsBlockProps {
  insights: Insight[];
}

export function InsightsBlock({ insights }: InsightsBlockProps) {
  return (
    <Card className="fade-in" sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LightbulbIcon color="primary" />
          <Typography variant="h6">AI-инсайты</Typography>
        </Box>
        {insights.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Typography color="text.secondary">Инсайты появятся после добавления операций</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ flex: 1 }}>
            {insights.slice(0, 5).map((insight) => (
              <ListItem key={insight.id} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  <LightbulbIcon fontSize="small" color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary={<PrivateText>{insight.text}</PrivateText>}
                  secondary={dayjs(insight.createdAt).format('D MMM, HH:mm')}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
