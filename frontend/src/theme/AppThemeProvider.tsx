import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useMemo } from 'react';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import type { AppThemeProviderProps } from './types/themeTypes';
import './styles/MuiOverrides.scss';

export function AppThemeProvider({ children }: AppThemeProviderProps) {
  const preference = useWorkspacePreferences((state) => state.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const mode =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#93f2c8' : '#087b68' },
          background: {
            default: mode === 'dark' ? '#123b39' : '#f1f8f5',
            paper: mode === 'dark' ? '#174946' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#ebf8f1' : '#143d39',
            secondary: mode === 'dark' ? '#a8c9c0' : '#55716b',
          },
          divider: mode === 'dark' ? '#2b625d' : '#d8e9e2',
        },
        typography: {
          fontFamily: 'Inter, "Segoe UI", Roboto, Helvetica, sans-serif',
          fontSize: 14,
          h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
          h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.25 },
          h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.3 },
          h4: { fontSize: '1.125rem', fontWeight: 600, lineHeight: 1.35 },
          subtitle1: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
          subtitle2: { fontSize: '0.875rem', fontWeight: 600, lineHeight: 1.4 },
          body1: { fontSize: '0.875rem', lineHeight: 1.5 },
          body2: { fontSize: '0.8125rem', lineHeight: 1.5 },
          button: { fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.25 },
          caption: { fontSize: '0.75rem', lineHeight: 1.4 },
        },
      }),
    [mode]
  );
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
