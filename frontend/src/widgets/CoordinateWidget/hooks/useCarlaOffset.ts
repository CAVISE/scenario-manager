import { useEditorRefs } from '@editor/context';
import { getOdrMapOffsets } from '@editor/lib/getOdrMapOffsets';

export const useCarlaOffset = () => {
  const { odrMapRef } = useEditorRefs();
  return getOdrMapOffsets(odrMapRef.current) ?? { x: 0, y: 0 };
};
