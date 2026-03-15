export interface EditorTransformControlsProps {
  transformMode: 'translate' | 'rotate' | 'scale';
  onSetMode: (mode: 'translate' | 'rotate' | 'scale') => void;
}
