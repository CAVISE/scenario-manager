import React from 'react';
import { Modal, Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { styled } from '@mui/system';

interface ImageViewerModalProps {
  open: boolean;
  onClose: () => void;
  imagePath: string;
  imageAlt: string;
}

const ImageViewerContainer = styled(Modal)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
});

const ImageBox = styled(Box)({
  maxWidth: '90%',
  maxHeight: '90%',
  position: 'relative',
  backgroundColor: '#fff',
  borderRadius: 4,
  overflow: 'hidden'
});

const CloseButton = styled(IconButton)({
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

const FullSizeImage = styled('img')({
  maxWidth: '100%',
  maxHeight: '90vh',
  display: 'block'
});

/**
 * Компонент для отображения полноразмерного изображения в модальном окне
 */
const ImageViewerModal: React.FC<ImageViewerModalProps> = ({ 
  open, 
  onClose, 
  imagePath, 
  imageAlt 
}) => {
  // Если нет пути к изображению, не рендерим компонент
  if (!open || !imagePath) return null;

  return (
    <ImageViewerContainer 
      open={open} 
      onClose={onClose}
      aria-labelledby="image-viewer-title"
      aria-describedby="image-viewer-description"
    >
      <ImageBox>
        <CloseButton aria-label="close" onClick={onClose}>
          <CloseIcon />
        </CloseButton>
        <FullSizeImage 
          src={imagePath} 
          alt={imageAlt}
          loading="lazy"
        />
      </ImageBox>
    </ImageViewerContainer>
  );
};

export default ImageViewerModal; 