import { styled } from '@mui/system';
import { Box, Card } from '@mui/material';
import {
  pressActiveSx,
  pressTransition,
} from '../../shared/styles/pressInteraction';

export interface MockScenario {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
}
export const boxStyles = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'text.secondary',
  fontSize: 12,
  overflow: 'hidden',
} as const;
export const imgStyles = {
  objectFit: 'cover',
  width: '100%',
  height: '100%',
} as const;
export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: 'SCN-001',
    name: 'Highway Merge',
    description:
      'A scenario simulating vehicle merging onto a highway with moderate traffic.',
    thumbnail: '/results/44_kinematics_plotting.png',
  },
  {
    id: 'SCN-002',
    name: 'Urban Intersection',
    description:
      'Complex urban intersection scenario with pedestrian crossings.',
    thumbnail: '/results/50_localization_plotting.png',
  },
  {
    id: 'SCN-003',
    name: 'Rain Collision Test',
    description:
      'Testing collision avoidance systems under heavy rain conditions.',
    thumbnail: '/results/20250513_081759_Collide_1.png',
  },
  {
    id: 'SCN-004',
    name: 'Accelerometer Calibration',
    description: 'Calibration run capturing accelerometer magnitude data.',
    thumbnail: '/results/20250513_081758_Accelerometer_Magnitude_4.png',
  },
  {
    id: 'SCN-005',
    name: 'Velocity Profile Test',
    description: 'Testing velocity profiles across varied terrain.',
    thumbnail: '/results/20250513_081757_velocity_1.png',
  },
  {
    id: 'SCN-006',
    name: 'Localization Benchmark',
    description:
      'Benchmarking localization accuracy with GPS signal interference.',
    thumbnail: '/results/56_localization_plotting.png',
  },
];
export const ModalContainerStyles = {
  maxHeight: '90vh',
  overflowY: 'auto',

  '&::-webkit-scrollbar': {
    display: 'none',
  },
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
} as const;
export const ModalContainer = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  maxWidth: 900,
  maxHeight: '85vh',
  overflow: 'auto',
  backgroundColor: 'white',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: 24,
  borderRadius: 8,
  display: 'flex',
  flexDirection: 'column',
});

export const ModalHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
});

export const ScenarioCard = styled(Card)({
  cursor: 'pointer',
  transition: `${pressTransition}, box-shadow 0.2s ease-in-out`,
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
});

export interface UploadScenariosModalProps {
  open: boolean;
  onClose: () => void;
}

export const uploadModalStyles = {
  width: '100%',
  maxHeight: 400,
  objectFit: 'contain',
  borderRadius: 1,
  bgcolor: '#f5f5f5',
} as const;

export const uploadModalBoxStyles = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
} as const;

export const ACCENT = '#4C6FE0';
export const ACCENT_HOVER = '#3C5BC7';
export const TEXT_PRIMARY = '#1A1D24';
export const TEXT_SECONDARY = '#6B7280';
export const BORDER = '#E5E7EB';
export const SURFACE_MUTED = '#F7F8FA';
export const titleStyles = {
  fontWeight: 600,
  color: TEXT_PRIMARY,
  letterSpacing: '-0.01em',
};

export const backButtonStyles = {
  ...pressActiveSx,
  color: TEXT_SECONDARY,
  '&:hover': { color: TEXT_PRIMARY, bgcolor: SURFACE_MUTED },
};

export const closeButtonStyles = {
  ...pressActiveSx,
  color: TEXT_SECONDARY,
  '&:hover': { color: TEXT_PRIMARY, bgcolor: SURFACE_MUTED },
};

export const alertStyles = {
  mb: 2,
  bgcolor: '#EEF2FF',
  color: TEXT_PRIMARY,
  border: `1px solid #DCE3FA`,
  '& .MuiAlert-icon': { color: ACCENT },
};

export const emptyStateStyles = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  py: 8,
  width: '100%',
  border: `1px dashed ${BORDER}`,
  borderRadius: '10px',
};

export const listContainerStyles = {
  display: 'flex',
  flexDirection: 'column',
  gap: 1.25,
  width: '100%',
};

export const scenarioCardStyles = {
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'stretch',
  width: '100%',
  minHeight: 150,
  bgcolor: '#FFFFFF',
  border: `1px solid ${BORDER}`,
  borderRadius: '12px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: `${pressTransition}, border-color 160ms ease, box-shadow 160ms ease, background-color 160ms ease`,
  '&:hover': {
    borderColor: ACCENT,
    boxShadow: '0 2px 10px rgba(76,111,224,0.12)',
    bgcolor: '#FAFBFF',
  },
  '&:active': {
    transform: 'scale(0.99)',
  },
};

export const cardThumbWrapStyles = {
  position: 'relative',
  flex: '0 0 240px',
  minHeight: 150,
  bgcolor: '#0E0F12',
  overflow: 'hidden',
};

export const cardBodyStyles = {
  flex: 1,
  minWidth: 0,
  p: 2.5,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  gap: 0.6,
};

export const cardTitleStyles = {
  color: TEXT_PRIMARY,
  fontWeight: 600,
  maxWidth: '70%',
};

export const cardIdStyles = {
  color: '#9CA3AF',
  fontFamily: 'monospace',
  fontSize: '0.7rem',
};

export const cardAnnotationStyles = {
  color: TEXT_SECONDARY,
  fontSize: '0.85rem',
  lineHeight: 1.4,
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
};

export const cardAnnotationEmptyStyles = {
  color: '#B0B5BE',
  fontSize: '0.85rem',
  fontStyle: 'italic',
};

export const cardChevronStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: '0 0 40px',
  color: '#C6CAD3',
};

export const detailImageStyles = {
  width: '100%',
  maxHeight: 340,
  objectFit: 'cover',
  borderRadius: '10px',
  border: `1px solid ${BORDER}`,
  bgcolor: '#0E0F12',
};

export const detailImagePlaceholderStyles = {
  width: '100%',
  minHeight: 200,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#9CA3AF',
  bgcolor: SURFACE_MUTED,
  border: `1px solid ${BORDER}`,
  borderRadius: '10px',
};

export const fieldStyles = {
  '& .MuiInputLabel-root': { color: TEXT_SECONDARY },
  '& .MuiInputLabel-root.Mui-focused': { color: ACCENT },
  '& .MuiOutlinedInput-root': {
    bgcolor: '#FFFFFF',
    color: TEXT_PRIMARY,
    '& fieldset': { borderColor: BORDER },
    '&:hover fieldset': { borderColor: '#C6CAD3' },
    '&.Mui-focused fieldset': { borderColor: ACCENT },
  },
  '& .MuiInputBase-input': { color: TEXT_PRIMARY },
};

export const loadButtonStyles = {
  ...pressActiveSx,
  bgcolor: ACCENT,
  color: '#fff',
  fontWeight: 600,
  textTransform: 'none',
  px: 3,
  '&:hover': { bgcolor: ACCENT_HOVER },
  '&.Mui-disabled': { bgcolor: '#C9D3F5', color: '#fff' },
};

export const saveButtonStyles = {
  ...pressActiveSx,
  borderColor: ACCENT,
  color: ACCENT,
  fontWeight: 600,
  textTransform: 'none',
  px: 3,
  '&:hover': { borderColor: ACCENT_HOVER, bgcolor: '#F5F7FE' },
  '&.Mui-disabled': { borderColor: BORDER, color: '#B0B5BE' },
};
