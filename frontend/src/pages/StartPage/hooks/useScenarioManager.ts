import { ScenarioListItem } from '@/api/types/IScenarioTypes';
import {
  handlePatch,
  handleCreate,
} from '@right-panel/components/ScenarioControlWidget/Handlers';
import {
  useScenariosListQuery,
  useScenarioCreateMutation,
  useScenarioPatchMutation,
} from '@editor/hooks/useApiHooks/useScenarioQueries';
import { useEditorStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../constants/StartPage.constants';
import { useStoreReset } from './useStoreReset';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';

export const useScenarioManager = () => {
  const resetStore = useStoreReset();
  const navigate = useNavigate();
  const scenario = useEditorStore((s) => s.Scenario);
  const updateScenario = useEditorStore((s) => s.updateScenario);

  const {
    data: scenarios = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useScenariosListQuery(true);
  const createMutation = useScenarioCreateMutation();
  const patchMutation = useScenarioPatchMutation();

  const handleCreateNew = () => {
    resetStore();
    navigate(ROUTES.EDITOR);
  };

  const handleSave = (notice: (msg: string) => void) => {
    if (!scenario.name.trim()) {
      notice('Scenario name is required.');
      return;
    }

    if (scenario.id) {
      handlePatch(notice, scenario.id, true, patchMutation);
    } else {
      handleCreate(notice, createMutation);
    }
  };

  const handleOpen = (item: ScenarioListItem) => {
    useWorkspacePreferences.getState().recordOpened(item.scenario_id);
    navigate(
      `${ROUTES.EDITOR}?scenario=${encodeURIComponent(item.scenario_id)}`
    );
  };

  return {
    scenario,
    scenarios,
    isLoading,
    isError,
    error,
    refetch,
    isSaving: createMutation.isPending || patchMutation.isPending,
    handleCreateNew,
    handleSave,
    handleOpen,
    updateScenario,
  };
};
