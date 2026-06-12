import { Box, SxProps, Theme } from '@mui/material';
import { ReactNode } from 'react';
import { usePrivacyStore } from '@/store/usePrivacyStore';

interface PrivacyBlurProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
  inline?: boolean;
}

export function PrivacyBlur({ children, sx, inline = true }: PrivacyBlurProps) {
  const amountsHidden = usePrivacyStore((s) => s.amountsHidden);

  if (!amountsHidden) {
    return <>{children}</>;
  }

  return (
    <Box
      component={inline ? 'span' : 'div'}
      sx={{
        filter: 'blur(6px)',
        opacity: 0.85,
        userSelect: 'none',
        WebkitUserSelect: 'none',
        display: inline ? 'inline-block' : 'block',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
