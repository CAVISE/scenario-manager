import { CoordinatesWidget } from '../../CoordinateWidget';
import { useHooks } from '@editor/context';
import { EditorTransformControls } from '../../EditorTransformControls';
import { lazy, Suspense, useEffect, useState } from 'react';
import { useMediaQuery } from '@mui/material';
import { EditorToolbar } from '../../EditorToolbar';
import type { EditorTab } from '../../EditorNavigation/types/EditorNavigationTypes';
import SceneTreePanel from '@right-panel/components/SceneTreePanel';
import { useEditorStore } from '@/store';
import { useScenarioControls } from '@right-panel/components/ScenarioControlWidget/hooks/useScenarioControls';
import { useSelectionSceneSync } from '@editor/hooks/useEditorEngine/useSelectionSceneSync/useSelectionSceneSync';
import SelectionBadge from '../../SelectionBadge';
import EditorNavigation from '../../EditorNavigation';
import '../styles/EditorChrome.scss';

const RightPanel = lazy(() => import('../../../../components/RightPanel'));
const EditorModals = lazy(() => import('../../EditorModals'));
export function EditorUI() {
  const { loadingText } = useHooks();
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');
  const narrowViewport = useMediaQuery('(max-width: 1150px)');
  const [sceneOpen, setSceneOpen] = useState<boolean | null>(null);
  const showScene = sceneOpen ?? !narrowViewport;
  useEffect(() => {
    const showObjects = () => setSceneOpen(true);
    window.addEventListener('editor-show-in-scene-graph', showObjects);
    return () =>
      window.removeEventListener('editor-show-in-scene-graph', showObjects);
  }, []);
  const scenarioName = useEditorStore((s) => s.Scenario.name);
  const map = useEditorStore((s) => s.simConfig.carla.map);
  const controls = useScenarioControls();
  const isSimulationRunning = useEditorStore(
    (s) => s.simulationSession.phase === 'running'
  );
  useSelectionSceneSync(isSimulationRunning || controls.isBusy);

  return (
    <div
      className="editor-chrome"
      data-testid="editor-workspace"
      data-workspace={activeTab}
      aria-busy={loadingText !== null}
    >
      <header className="editor-command-bar">
        <div className="editor-scenario-heading">
          <span
            className="editor-scenario-name"
            title={scenarioName || 'Untitled scenario'}
          >
            {scenarioName || 'Untitled scenario'}
          </span>
          <span className="editor-scenario-map">
            {map || 'No map selected'}
            {isSimulationRunning ? ' · View only' : ''}
          </span>
        </div>
        <EditorToolbar
          readOnly={isSimulationRunning || controls.isBusy}
          onWorkspaceChange={setActiveTab}
          onSave={controls.save}
          onToggleScene={() => setSceneOpen(!showScene)}
          sceneGraphOpen={showScene}
          showSceneToggle={activeTab === 'edit'}
          isSaving={controls.operation === 'save'}
        />
      </header>

      <EditorNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'edit' && (
        <div
          id="editor-scene-objects"
          className="editor-scene-graph-column"
          hidden={!showScene}
          aria-label="Scene objects"
        >
          <SceneTreePanel readOnly={isSimulationRunning || controls.isBusy} />
        </div>
      )}

      {activeTab === 'edit' && (
        <EditorTransformControls
          readOnly={isSimulationRunning || controls.isBusy}
        />
      )}

      <Suspense fallback={null}>
        <RightPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          controls={controls}
          showSceneGraph={false}
          readOnly={isSimulationRunning}
        />
      </Suspense>

      <Suspense fallback={null}>
        <EditorModals />
      </Suspense>
      <div className="editor-scene-status">
        <SelectionBadge />
        <CoordinatesWidget />
      </div>
    </div>
  );
}
