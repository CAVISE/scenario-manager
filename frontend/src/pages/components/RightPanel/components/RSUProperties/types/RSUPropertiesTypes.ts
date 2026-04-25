import { RSU } from '../../../../../../../store/useEditorStore';

export interface RSUPropertiesProps {
  rsu: RSU;
  onDelete: () => void;
}
export const RsuPropertiesTextareaStyles = {
  width: '100%',
  fontFamily: 'monospace',
  fontSize: 12,
  padding: 8,
  borderRadius: 4,
  border: '1px solid #ccc',
  resize: 'vertical',
  boxSizing: 'border-box',
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
} as const;
