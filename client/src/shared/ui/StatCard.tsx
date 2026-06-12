import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  subtitle?: ReactNode;
  loading?: boolean;
}

export function StatCard({ title, value, icon, color, subtitle, loading }: StatCardProps) {
  if (loading) {
    return (
      <Card className="fade-in">
        <CardContent>
          <Skeleton width="60%" />
          <Skeleton width="80%" height={40} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="fade-in" sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h5" fontWeight={700} sx={{ color: color || 'text.primary' }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" component="div">
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box
              sx={{
                p: 1,
                borderRadius: 2,
                bgcolor: color ? `${color}15` : 'action.hover',
                color: color || 'primary.main',
              }}
            >
              {icon}
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
