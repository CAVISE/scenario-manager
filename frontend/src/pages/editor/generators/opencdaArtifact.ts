import { generateOpenCDAConfig } from './exporters';
import { mergeSimConfigWithDefaults } from './generators.types';
import type { OpenCDAArtifactState } from './opencdaArtifact.types';

export function buildOpenCDAArtifact(state: OpenCDAArtifactState): string {
  return generateOpenCDAConfig(
    mergeSimConfigWithDefaults(state.simConfig),
    state.cars,
    state.RSUs,
    state.points,
    state.lidars,
  );
}
