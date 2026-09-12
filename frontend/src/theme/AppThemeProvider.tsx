import { createTheme, ThemeProvider } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { appTheme } from './appTheme';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const preference = useWorkspacePreferences((state) => state.theme);
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');
  const mode =
    preference === 'system' ? (systemDark ? 'dark' : 'light') : preference;
  const theme = useMemo(
    () =>
      createTheme({
        ...appTheme,
        palette: {
          mode,
          primary: { main: mode === 'dark' ? '#8ab8ff' : '#2163e8' },
          background: {
            default: mode === 'dark' ? '#102132' : '#f3f7fc',
            paper: mode === 'dark' ? '#172e44' : '#ffffff',
          },
          text: {
            primary: mode === 'dark' ? '#e3edf8' : '#153653',
            secondary: mode === 'dark' ? '#a3bdd5' : '#56718a',
          },
          divider: mode === 'dark' ? '#2d4963' : '#d8e5f2',
        },
        typography: {
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        },
      }),
    [mode]
  );
  useEffect(() => {
    document.documentElement.dataset.theme = mode;
  }, [mode]);
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}
