import React from 'react';
import { IconButton } from '@mui/material';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import type { EditorTransformControlsProps } from './types/EditorTransformControlsTypes';

export const EditorTransformControls: React.FC<EditorTransformControlsProps> = ({
  transformMode,
  onSetMode,
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 50,
      left: 10,
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255,255,255,0.8)',
      borderRadius: 4,
      padding: 4,
      zIndex: 10
    }}>
      <IconButton
        size="small"
        color={transformMode === 'translate' ? 'primary' : 'default'}
        onClick={() => onSetMode('translate')}
      >
        <OpenWithIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color={transformMode === 'rotate' ? 'primary' : 'default'}
        onClick={() => onSetMode('rotate')}
      >
        <RotateRightIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color={transformMode === 'scale' ? 'primary' : 'default'}
        onClick={() => onSetMode('scale')}
      >
        <ZoomOutMapIcon fontSize="small" />
      </IconButton>
    </div>
  );
};
