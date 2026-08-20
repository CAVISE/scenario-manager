import { pressActiveSx, pressTransition } from '@/theme/pressInteraction';

export interface EditorModalsProps {
  telemetryModalOpen: boolean;
  simulationConfirmOpen: boolean;
  onCloseTelemetry: () => void;
  onCloseSimulationConfirm: () => void;
  onStartSimulation: () => void;
}
declare global {
  export interface Window {
    editorModals?: {
      openTelemetry: () => void;
      openSimulation: () => void;
      openMapPicker: () => void;
    };
  }
}
export const EditorModalsStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  border: '1px solid #ccc',
  boxShadow: 24,
  p: 4,
  textAlign: 'center',
} as const;

export const EditorModalButtonStyles = {
  bgcolor: 'error.main',
  '&:hover': { bgcolor: 'error.dark' },
} as const;
export const TelemetryModalStyles = { mt: 2, mb: 3 } as const;

export const ACCENT = '#4C6FE0';
export const ACCENT_HOVER = '#3C5BC7';
export const TEXT_PRIMARY = '#1A1D24';
export const TEXT_SECONDARY = '#6B7280';
export const BORDER = '#E5E7EB';
export const SURFACE_MUTED = '#F7F8FA';

export const confirmModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 420,
  bgcolor: '#FFFFFF',
  border: `1px solid ${BORDER}`,
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(17,20,28,0.18)',
  p: 4,
  textAlign: 'center',
};

export const confirmIconWrapStyles = {
  display: 'flex',
  justifyContent: 'center',
  mb: 1.5,
};

export const confirmTitleStyles = {
  fontWeight: 600,
  color: TEXT_PRIMARY,
  mb: 1,
};

export const confirmBodyStyles = {
  color: TEXT_SECONDARY,
  fontSize: '0.9rem',
  lineHeight: 1.5,
  mb: 1,
};

export const confirmActionsStyles = {
  display: 'flex',
  justifyContent: 'center',
  gap: 1.5,
  mt: 3,
};

export const cancelButtonStyles = {
  ...pressActiveSx,
  color: TEXT_SECONDARY,
  textTransform: 'none',
  fontWeight: 500,
  '&:hover': { bgcolor: SURFACE_MUTED },
};

export const runButtonStyles = {
  ...pressActiveSx,
  bgcolor: ACCENT,
  color: '#fff',
  fontWeight: 600,
  textTransform: 'none',
  px: 3,
  '&:hover': { bgcolor: ACCENT_HOVER },
  '&.Mui-disabled': { bgcolor: '#C9D3F5', color: '#fff' },
};

export const inlineAlertStyles = {
  mt: 2,
  mb: 1,
  bgcolor: '#FDECEC',
  color: '#7A1F1F',
  border: '1px solid #F5C6C6',
  textAlign: 'left',
  '& .MuiAlert-icon': { color: '#C0392B' },
};

export const mapPickerModalStyles = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: 440,
  maxHeight: '70vh',
  bgcolor: '#FFFFFF',
  border: `1px solid ${BORDER}`,
  borderRadius: '16px',
  boxShadow: '0 20px 60px rgba(17,20,28,0.18)',
  p: 3,
  overflow: 'auto',
};

export const mapPickerHeaderStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  mb: 2,
};

export const mapPickerTitleStyles = {
  fontWeight: 600,
  color: TEXT_PRIMARY,
};

export const mapListStyles = {
  p: 0,
  display: 'flex',
  flexDirection: 'column',
  gap: 0.5,
};

export const mapListItemStyles = {
  borderRadius: '10px',
  border: `1px solid transparent`,
  transition: `${pressTransition}, background-color 140ms ease, border-color 140ms ease`,
  '&:hover': {
    bgcolor: '#F5F7FF',
    borderColor: '#DCE3FA',
  },
  '&:active:not(.Mui-disabled)': {
    transform: 'scale(0.98)',
  },
  '&.Mui-disabled': {
    opacity: 0.5,
  },
};

export const mapItemPrimaryStyles = {
  color: TEXT_PRIMARY,
  fontWeight: 500,
  fontSize: '0.92rem',
};

export const mapItemSecondaryStyles = {
  color: ACCENT,
  fontSize: '0.78rem',
};
