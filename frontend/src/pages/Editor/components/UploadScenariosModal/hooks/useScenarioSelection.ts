import { useState, useCallback } from 'react';
import { ScenarioListItem } from '@/api/types/IScenarioTypes';

export const useScenarioSelection = () => {
  const [selectedScenario, setSelectedScenario] =
    useState<ScenarioListItem | null>(null);

  const selectScenario = useCallback((scenario: ScenarioListItem) => {
    setSelectedScenario(scenario);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedScenario(null);
  }, []);

  return {
    selectedScenario,
    selectScenario,
    clearSelection,
  };
};
