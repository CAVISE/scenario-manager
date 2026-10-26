import { useCallback, useState } from 'react';

import { useEditorStore } from '@/store';
import { hasUnsavedScenarioChanges } from '@/shared/lib/scenarioDraftFingerprint';

type MapChangeConfirmationOptions = {
  selectMap: (mapName: string) => Promise<boolean>;
};

type PendingMapChange = {
  mapName: string;
  onSuccess?: () => void;
};

export function useMapChangeConfirmation({
  selectMap,
}: MapChangeConfirmationOptions) {
  const [pendingChange, setPendingChange] = useState<PendingMapChange | null>(
    null
  );

  const requestMapChange = useCallback(
    async (mapName: string, onSuccess?: () => void) => {
      if (hasUnsavedScenarioChanges(useEditorStore.getState())) {
        setPendingChange({ mapName, onSuccess });
        return;
      }

      if (await selectMap(mapName)) onSuccess?.();
    },
    [selectMap]
  );

  const cancelMapChange = useCallback(() => setPendingChange(null), []);
  const discardAndChangeMap = useCallback(async () => {
    if (!pendingChange) return;

    setPendingChange(null);
    if (await selectMap(pendingChange.mapName)) pendingChange.onSuccess?.();
  }, [pendingChange, selectMap]);

  return {
    pendingMap: pendingChange?.mapName ?? null,
    requestMapChange,
    cancelMapChange,
    discardAndChangeMap,
  };
}
