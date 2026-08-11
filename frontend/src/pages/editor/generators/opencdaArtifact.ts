import type { EditorState } from '../../../store/editor-store.types';
import { generateOpenCDAConfig } from './exporters';
import { mergeSimConfigWithDefaults } from './generators.types';

export type OpenCDAArtifactState = Pick<
  EditorState,
  'simConfig' | 'cars' | 'RSUs' | 'points' | 'lidars'
>;

export function buildOpenCDAArtifact(state: OpenCDAArtifactState): string {
  return generateOpenCDAConfig(
    mergeSimConfigWithDefaults(state.simConfig),
    state.cars,
    state.RSUs,
    state.points,
    state.lidars,
  );
}
