import { useMemo } from 'react';
import {
  type SimulationConfig,
  defaultSimConfig,
} from '../../../../generators/generators.types';
import { useEditorStore } from '../../../../../../store';

export type CapiConfig = SimulationConfig['capi'];

export const useCapiConfig = () => {
  const simConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigCAPI = useEditorStore((s) => s.updateSimConfigCAPI);

  const capi = useMemo(
    () => simConfig.capi ?? defaultSimConfig.capi,
    [simConfig.capi],
  );

  return { capi, updateSimConfigCAPI };
};
