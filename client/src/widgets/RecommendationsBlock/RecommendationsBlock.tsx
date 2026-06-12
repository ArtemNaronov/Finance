import { Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Chip, Box } from '@mui/material';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { PrivateText } from '@/shared/ui/PrivateText';
import type { Recommendation } from '@/types';

interface RecommendationsBlockProps {
  recommendations: Recommendation[];
}

export function RecommendationsBlock({ recommendations }: RecommendationsBlockProps) {
  return (
    <Card className="fade-in" sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TipsAndUpdatesIcon color="secondary" />
          <Typography variant="h6">Рекомендации</Typography>
        </Box>
        {recommendations.length === 0 ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
            <Typography color="text.secondary">Рекомендации появятся при накоплении данных</Typography>
          </Box>
        ) : (
          <List dense disablePadding sx={{ flex: 1 }}>
            {recommendations.map((rec) => (
              <ListItem key={rec.id} alignItems="flex-start" sx={{ px: 0 }}>
                <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                  {rec.source === 'ai' ? (
                    <AutoAwesomeIcon fontSize="small" color="secondary" />
                  ) : (
                    <TipsAndUpdatesIcon fontSize="small" color="action" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
                      <PrivateText>{rec.text}</PrivateText>
                      {rec.source === 'ai' && (
                        <Chip label="AI" size="small" color="secondary" variant="outlined" />
                      )}
                    </Box>
                  }
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
