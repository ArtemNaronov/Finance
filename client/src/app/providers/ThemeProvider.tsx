import { ReactNode, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/ru';
import { useThemeStore } from '@/store/useThemeStore';

interface Props {
  children: ReactNode;
}

export function ThemeProvider({ children }: Props) {
  const mode = useThemeStore((s) => s.mode);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5' },
          secondary: { main: '#8b5cf6' },
          success: { main: '#22c55e' },
          error: { main: '#ef4444' },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0f172a',
            paper: mode === 'light' ? '#ffffff' : '#1e293b',
          },
        },
        typography: {
          fontFamily: '"Inter", sans-serif',
          h4: { fontWeight: 700 },
          h5: { fontWeight: 600 },
          h6: { fontWeight: 600 },
        },
        shape: { borderRadius: 12 },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow:
                  mode === 'light'
                    ? '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)'
                    : '0 1px 3px rgba(0,0,0,0.3)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow:
                    mode === 'light'
                      ? '0 4px 16px rgba(0,0,0,0.1)'
                      : '0 4px 16px rgba(0,0,0,0.4)',
                },
              },
            },
          },
          MuiButton: {
            styleOverrides: {
              root: { textTransform: 'none', fontWeight: 500 },
            },
          },
        },
      }),
    [mode],
  );

  return (
    <MuiThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="ru">
        <CssBaseline />
        {children}
      </LocalizationProvider>
    </MuiThemeProvider>
  );
}
