import { ScenarioListItem } from '@/api/types/IScenarioTypes';

export interface ScenarioCardProps {
  scenario: ScenarioListItem;
  onSelect: (scenario: ScenarioListItem) => void;
}

export interface ScenarioDetailProps {
  scenario: ScenarioListItem;
  onSave: (id: string, description: string) => Promise<void>;
  onLoad: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
}
