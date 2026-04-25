export interface EditorTransformControlsProps {
  transformMode: 'translate' | 'rotate' | 'scale';
  onSetMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}
export const EditorTransformControlsStyles = {
  position: 'absolute',
  top: 50,
  left: 10,
  display: 'flex',
  flexDirection: 'column',
  background: 'rgba(255,255,255,0.8)',
  borderRadius: 4,
  padding: 4,
  zIndex: 10,
} as const;
