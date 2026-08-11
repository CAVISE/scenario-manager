import type { SxProps, Theme } from '@mui/material/styles';

export const PRESS_EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
export const PRESS_MS = '170ms';

export const pressTransition = `transform ${PRESS_MS} ${PRESS_EASE}, background-color ${PRESS_MS} ease, border-color ${PRESS_MS} ease, box-shadow ${PRESS_MS} ease, color ${PRESS_MS} ease, opacity ${PRESS_MS} ease`;

export const pressActiveScale = 0.96;
export const visiblePressScale = 0.985;

export const pressActiveSx = {
  transition: pressTransition,
  '&:active:not(:disabled):not(.Mui-disabled)': {
    transform: `scale(${pressActiveScale})`,
  },
} satisfies SxProps<Theme>;

export const muiPressableRootStyle = {
  transition: pressTransition,
  '&:active:not(:disabled):not(.Mui-disabled)': {
    transform: `scale(${pressActiveScale})`,
  },
};
