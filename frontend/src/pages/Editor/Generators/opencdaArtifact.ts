import type { EditorState } from '../../../store/types/useEditorStoreTypes';
import { generateOpenCDAConfig } from './exporters';
import { mergeSimConfigWithDefaults } from './types/configGeneratorsTypes';

export type OpenCDAArtifactState = Pick<
  EditorState,
  'simConfig' | 'cars' | 'RSUs' | 'points' | 'lidars'
>;

/** Build the exact YAML artifact shared by export and simulation startup. */
export function buildOpenCDAArtifact(state: OpenCDAArtifactState): string {
  return generateOpenCDAConfig(
    mergeSimConfigWithDefaults(state.simConfig),
    state.cars,
    state.RSUs,
    state.points,
    state.lidars,
  );
}
