import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 6,
        px: 2,
        color: 'text.secondary',
      }}
    >
      {icon && <Box sx={{ mb: 2, opacity: 0.5 }}>{icon}</Box>}
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {description && <Typography variant="body2">{description}</Typography>}
    </Box>
  );
}
