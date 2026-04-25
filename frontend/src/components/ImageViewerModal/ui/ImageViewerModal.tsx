import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import {
  ImageViewerContainer,
  ImageBox,
  CloseButton,
  FullSizeImage,
} from '../types/ImageViewerModalTypes';
import type { ImageViewerModalProps } from '../types/ImageViewerModalTypes';

const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  open,
  onClose,
  imagePath,
  imageAlt,
}) => {
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
        <FullSizeImage src={imagePath} alt={imageAlt} loading="lazy" />
      </ImageBox>
    </ImageViewerContainer>
  );
};

export default ImageViewerModal;
