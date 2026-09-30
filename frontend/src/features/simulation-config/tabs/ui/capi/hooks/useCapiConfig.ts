import { defaultSimConfig } from '@scenario-export';
import { useEditorStore } from '@/store';
import { useMemo } from 'react';

export const useCapiConfig = () => {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCAPI = useEditorStore((s) => s.updateSimConfigCAPI);

  const capi = useMemo(
    () => simConfig.capi ?? defaultSimConfig.capi,
    [simConfig.capi]
  );

  return { capi, updateSimConfigCAPI };
};
