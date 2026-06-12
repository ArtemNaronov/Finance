import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './providers/ThemeProvider';
import { router } from './router';
import { useFinanceStore } from '@/store/useFinanceStore';

export function App() {
  const refreshAll = useFinanceStore((s) => s.refreshAll);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  );
}
