import { useEditorRefs } from '@editor/context';
import { getOdrMapOffsets } from '@editor/lib/getOdrMapOffsets';
import { odrOffsetsToCarlaOffsets } from '@/shared/lib/coordinateTransform';

export const useCarlaOffset = () => {
  const { odrMapRef } = useEditorRefs();
  const offsets = getOdrMapOffsets(odrMapRef.current);
  return offsets ? odrOffsetsToCarlaOffsets(offsets) : { x: 0, y: 0 };
};
