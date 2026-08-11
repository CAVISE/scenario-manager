import type { EditorState } from '../../../store/editor-store.types';

export type OpenCDAArtifactState = Pick<
  EditorState,
  'simConfig' | 'cars' | 'RSUs' | 'points' | 'lidars'
>;
