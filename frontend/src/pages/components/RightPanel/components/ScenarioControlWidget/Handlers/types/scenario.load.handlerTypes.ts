import type { LOADING_STEPS } from '../../../../../../Editor/types/editorTypes';

export interface LoadScenarioOptions {
  hasId: boolean;
  scenarioIdInput: string;
  setNotice: (value: string) => void;
  updateSceneGraph: () => void;
  loadFile: (fileContent: string, x: boolean) => void;
  setStep?: (step: keyof typeof LOADING_STEPS) => void;
}
