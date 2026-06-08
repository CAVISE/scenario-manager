import { styled } from '@mui/material/styles';
import { Box, Chip, Card, Typography } from '@mui/material';

export interface TelemetryModalProps {
  open: boolean;
  onClose: () => void;
}

export type TabCategories = 'routes' | 'telemetry' | 'localization' | 'other';

export type ImagesByTabType = Record<
  TabCategories,
  Array<{ url: string; name: string }>
>;

export interface SimStatus {
  run_id: string | null;
  status: string;
}

export interface FileEntry {
  filename: string;
  url: string;
}

export interface ResultsResponse {
  files: FileEntry[];
  run_id: string;
}

export const ModalContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'min(94vw, 1280px)',
  maxHeight: '92vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[24],
}));

export const ModalHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,
  padding: '20px 24px 12px',
});

export const TitleContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

export const DemoChip = styled(Chip)(({ theme }) => ({
  backgroundColor: theme.palette.warning.main,
  color: theme.palette.warning.contrastText,
  fontWeight: 700,
  fontSize: '0.65rem',
  height: 24,
  letterSpacing: '0.04em',
}));

export const TabsBar = styled(Box)(({ theme }) => ({
  flexShrink: 0,
  padding: '0 24px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  '& .MuiTab-root': {
    minHeight: 44,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.875rem',
  },
}));

export const TabPanel = styled(Box)({
  flex: 1,
  overflow: 'auto',
  padding: '16px 24px 24px',
});

export const EmptyStateBox = styled(Box)(({ theme }) => ({
  padding: theme.spacing(6, 4),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

export const ImageCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  borderRadius: Number(theme.shape.borderRadius) * 1.25,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.02)'
      : theme.palette.background.default,
  transition: theme.transitions.create(
    ['border-color', 'box-shadow', 'transform'],
    { duration: theme.transitions.duration.shortest },
  ),
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.45)' : 'rgba(15, 23, 42, 0.12)'}`,
    transform: 'translateY(-2px)',
  },
}));

export const ImagePreviewFrame = styled(Box)(({ theme }) => ({
  position: 'relative',
  width: '100%',
  flex: '1 1 auto',
  minHeight: 160,
  aspectRatio: '4 / 3',
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgb(11, 15, 23)' : 'rgb(248, 250, 252)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

export const ImagePreviewImg = styled('img')({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  objectPosition: 'center',
  padding: 10,
  boxSizing: 'border-box',
  display: 'block',
});

export const ImageCaption = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(1.25, 1.5),
  textAlign: 'center',
  fontSize: '0.8rem',
  fontWeight: 500,
  lineHeight: 1.35,
  color: theme.palette.text.secondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));
