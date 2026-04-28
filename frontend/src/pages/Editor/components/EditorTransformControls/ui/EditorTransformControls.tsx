import { IconButton } from '@mui/material';
import OpenWithIcon from '@mui/icons-material/OpenWith';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';
import { EditorTransformControlsStyles } from '../types/EditorTransformControlsTypes';
import { useTransformMode } from '../../../hooks/useEditorEngine/useTransformMode';
import { useEditorRefs } from '../../../context';

export const EditorTransformControls = () => {
  const { transformControlsRef } = useEditorRefs();
  const { transformMode, handleSetMode } =
    useTransformMode(transformControlsRef);

  return (
    <div style={EditorTransformControlsStyles} data-testid="transform-controls">
      <IconButton
        size="small"
        color={transformMode === 'translate' ? 'primary' : 'default'}
        onClick={() => handleSetMode('translate')}
        aria-label="Transform translate"
        data-testid="transform-translate"
      >
        <OpenWithIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color={transformMode === 'rotate' ? 'primary' : 'default'}
        onClick={() => handleSetMode('rotate')}
        aria-label="Transform rotate"
        data-testid="transform-rotate"
      >
        <RotateRightIcon fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color={transformMode === 'scale' ? 'primary' : 'default'}
        onClick={() => handleSetMode('scale')}
        aria-label="Transform scale"
        data-testid="transform-scale"
      >
        <ZoomOutMapIcon fontSize="small" />
      </IconButton>
    </div>
  );
};
