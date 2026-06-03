import { Modal, Box, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

export interface ImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  imagePath: string;
  imageAlt: string;
}

export const ImageViewerContainer = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});

export const ImageBox = styled(Box)(({ theme }) => ({
  maxWidth: 'min(96vw, 1400px)',
  maxHeight: '92vh',
  position: 'relative',
  padding: theme.spacing(2),
  borderRadius: Number(theme.shape.borderRadius) * 1.5,
  overflow: 'hidden',
  backgroundColor:
    theme.palette.mode === 'dark' ? 'rgb(11, 15, 23)' : 'rgb(248, 250, 252)',
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[24],
}));

export const CloseButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: 8,
  top: 8,
  color: theme.palette.common.white,
  backgroundColor: 'rgba(0, 0, 0, 0.55)',
  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  zIndex: 10,
}));

export const FullSizeImage = styled('img')({
  display: 'block',
  maxWidth: '100%',
  maxHeight: '88vh',
  width: 'auto',
  height: 'auto',
  margin: '0 auto',
  objectFit: 'contain',
});
