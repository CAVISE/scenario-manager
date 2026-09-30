import type { ScenarioListItem } from '@/api/types/IScenarioTypes';

export interface UploadScenariosModalProps {
  open: boolean;
  onClose: () => void;
}

export interface ScenarioCardProps {
  scenario: ScenarioListItem;
  onScenarioSelect: (scenario: ScenarioListItem) => void;
}
