import { IconButton } from '@mui/material';
import { OpenWith as OpenWithIcon } from '@mui/icons-material';
import { RotateRight as RotateRightIcon } from '@mui/icons-material';
import { ZoomOutMap as ZoomOutMapIcon } from '@mui/icons-material';
import { EditorTransformControlsStyles } from '../types/EditorTransformControlsTypes';
import { useTransformMode } from '@editor/hooks/useEditorEngine/useTransformMode';
import { useEditorRefs } from '@editor/context';

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
