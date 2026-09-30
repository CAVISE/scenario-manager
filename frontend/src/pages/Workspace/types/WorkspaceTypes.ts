import type { ScenarioListItem } from '@/api/types/IScenarioTypes';

export interface ScenarioCardsProps {
  items: ScenarioListItem[];
  onOpen: (item: ScenarioListItem) => void;
  onCreate?: () => void;
  isLoading: boolean;
  error?: Error | null;
  currentId?: string;
  onRetry: () => void;
}
