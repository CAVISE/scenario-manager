import { createTheme } from '@mui/material/styles';
import { muiPressableRootStyle } from './pressInteraction';

export const appTheme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiFab: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiSpeedDialAction: {
      styleOverrides: {
        fab: muiPressableRootStyle,
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...muiPressableRootStyle,
          '&:active': {
            transform: 'scale(0.98)',
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: muiPressableRootStyle,
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.75rem',
          marginBottom: 4,
          color: 'text.secondary',
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          marginLeft: -8,
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          margin: 4,
          '& .MuiSwitch-switchBase': {
            transition: 'transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          },
          '& .MuiSwitch-thumb': {
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
          },
          '& .MuiSwitch-track': {
            transition: 'background-color 160ms ease-in-out',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            minHeight: 32,
            borderRadius: 8,
            transition:
              'border-color 160ms ease-in-out, box-shadow 160ms ease-in-out, background-color 160ms ease-in-out',
            '&:hover': {
              backgroundColor: 'rgba(15, 23, 42, 0.02)',
            },
            '&:focus-within': {
              boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
              borderColor: 'primary.main',
            },
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          minHeight: 32,
          borderRadius: 8,
          transition:
            'border-color 160ms ease-in-out, box-shadow 160ms ease-in-out, background-color 160ms ease-in-out',
          '&:hover': {
            backgroundColor: 'rgba(15, 23, 42, 0.02)',
          },
          '&.Mui-focused': {
            boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.12)',
            borderColor: 'primary.main',
          },
        },
      },
    },
  },
});
