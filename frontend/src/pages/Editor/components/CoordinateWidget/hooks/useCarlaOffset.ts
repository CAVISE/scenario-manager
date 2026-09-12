import { useMemo } from 'react';
import { useEditorRefs } from '@editor/context';

export const useCarlaOffset = () => {
  const { odrMapRef } = useEditorRefs();
  /* eslint-disable react-hooks/exhaustive-deps */
  return useMemo(
    () => ({
      x: odrMapRef.current?.x_offs ?? 0,
      y: odrMapRef.current?.y_offs ?? 0,
    }),
    [odrMapRef.current?.x_offs, odrMapRef.current?.y_offs]
  );
};
