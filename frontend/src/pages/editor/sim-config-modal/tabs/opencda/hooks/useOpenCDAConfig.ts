import { useMemo } from 'react';
import { useEditorStore } from '../../../../../../store';
import {
  defaultSimConfig,
  mergeSimConfigWithDefaults,
} from '../../../../generators/generators.types';
import { AIM_CHECK_SIM_OVERRIDES } from '../../../../generators/exporters/aimCheckDefaults';

export const useOpenCDAConfig = () => {
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const updateSimConfigOpenCDA = useEditorStore(
    (s) => s.updateSimConfigOpenCDA,
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);

  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig],
  );

  const oc = simConfig.opencda ?? defaultSimConfig.opencda;
  const baseColor = oc.vehicle_base_color ?? [122, 156, 111];

  const applyAimCheckDefaults = () => {
    const aimOc = AIM_CHECK_SIM_OVERRIDES.opencda!;
    updateSimConfig({
      carla: {
        ...simConfig.carla,
        map: AIM_CHECK_SIM_OVERRIDES.carla?.map ?? simConfig.carla.map,
      },
    });
    updateSimConfigOpenCDA({
      ...aimOc,
      bp_class_sample_prob: {
        ...oc.bp_class_sample_prob,
        ...aimOc.bp_class_sample_prob,
      },
      local_planner: { ...oc.local_planner, ...aimOc.local_planner },
      lidar_sim: { ...oc.lidar_sim, ...aimOc.lidar_sim },
      gnss_noise: { ...oc.gnss_noise, ...aimOc.gnss_noise },
    });
  };

  return {
    oc,
    baseColor,
    simConfig,
    updateSimConfigOpenCDA,
    updateSimConfig,
    applyAimCheckDefaults,
  };
};
