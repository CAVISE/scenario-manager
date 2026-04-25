import { styled } from '@mui/system';
import { Box, Chip } from '@mui/material';
import { Card } from '@mui/joy';
export interface TelemetryModalProps {
  open: boolean;
  onClose: () => void;
}
export type TabCategories = 'routes' | 'telemetry' | 'localization' | 'other';
export type ImagesByTabType = Record<
  TabCategories,
  Array<{ url: string; name: string }>
>;
export const ModalContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 1200,
  maxHeight: '90vh',
  overflow: 'auto',
  backgroundColor: 'white',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: 24,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
});
export const telemetryModalImageStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '100%',
} as const;
export const telemetryModalTypographyStyles = {
  p: 1,
  textAlign: 'center',
  fontSize: '0.875rem',
} as const;
export const telemetryModalAspectRatioStyles = { minHeight: 200 } as const;
export const telemetryModalBoxStyles = {
  borderBottom: 1,
  borderColor: 'divider',
  mb: 2,
} as const;

export const ModalHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
});

export const TitleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

export const DemoChip = styled(Chip)({
  backgroundColor: '#FFA726',
  color: '#FFFFFF',
  fontWeight: 'bold',
  fontSize: '0.7rem',
  height: '24px',
});

export const ImageCard = styled(Card)({
  cursor: 'pointer',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
  },
});

export const TabPanel = styled(Box)({
  padding: 8,
  flex: 1,
});
