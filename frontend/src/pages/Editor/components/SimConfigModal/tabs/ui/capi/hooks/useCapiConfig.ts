import { defaultSimConfig } from '@editor/Generators/types/configGeneratorsTypes';
import { useEditorStore, SimulationConfig } from '@/store';
import { useMemo } from 'react';

export type CapiConfig = SimulationConfig['capi'];

export const useCapiConfig = () => {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCAPI = useEditorStore((s) => s.updateSimConfigCAPI);

  const capi = useMemo(
    () => simConfig.capi ?? defaultSimConfig.capi,
    [simConfig.capi]
  );

  return { capi, updateSimConfigCAPI };
};
