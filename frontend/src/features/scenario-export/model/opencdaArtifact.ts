import { generateOpenCDAConfig } from './exporters';
import { mergeSimConfigWithDefaults } from './utils/configGeneratorUtils';
import type { OpenCDAArtifactState } from './types/exporterTypes';

export function buildOpenCDAArtifact(state: OpenCDAArtifactState): string {
  return generateOpenCDAConfig(
    mergeSimConfigWithDefaults(state.simConfig),
    state.cars,
    state.RSUs,
    state.points,
    state.lidars
  );
}
