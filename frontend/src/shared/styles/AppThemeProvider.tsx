import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { appTheme } from './theme';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  return <ThemeProvider theme={appTheme}>{children}</ThemeProvider>;
}
