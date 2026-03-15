import { Modal, Box, IconButton } from '@mui/material';
import { styled } from '@mui/system';
export interface ImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  imagePath: string;
  imageAlt: string;
}

export const ImageViewerContainer = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

export const ImageBox = styled(Box)({
  maxWidth: '90%',
  maxHeight: '90%',
  position: 'relative',
  backgroundColor: '#fff',
  borderRadius: 4,
  overflow: 'hidden'
});

export const CloseButton = styled(IconButton)({
  position: 'absolute',
  right: 8,
  top: 8,
  color: 'white',
  backgroundColor: 'rgba(0,0,0,0.5)',
  '&:hover': {
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  zIndex: 10
});

export const FullSizeImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '90vh',
  display: 'block'
});
