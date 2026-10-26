import { CoordinatesWidget } from '@widgets/CoordinateWidget';
import { EditorTransformControls } from '../../EditorTransformControls';
import { lazy, Suspense, useEffect, useState, type CSSProperties } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EditorToolbar } from '@widgets/EditorToolbar';
import type { EditorTab } from '@widgets/EditorNavigation/types/EditorNavigationTypes';
import SceneTreePanel from '@right-panel/components/SceneTreePanel';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { useScenarioControls } from '@right-panel/components/ScenarioControlWidget/hooks/useScenarioControls';
import { useSelectionSceneSync } from '@editor/hooks/useEditorEngine/useSelectionSceneSync/useSelectionSceneSync';
import SelectionBadge from '../../SelectionBadge';
import EditorNavigation from '@widgets/EditorNavigation';
import { useResizablePanel } from '../model/useResizablePanel';
import '../styles/EditorChrome.scss';

const RightPanel = lazy(() => import('@/widgets/RightPanel'));
const EditorModals = lazy(() => import('../../EditorModals'));
export function EditorUI() {
  const [activeTab, setActiveTab] = useState<EditorTab>('edit');
  const [searchParams] = useSearchParams();
  const preferredResultRunId = searchParams.get('run');
  const preferences = useWorkspacePreferences();
  const showScene = preferences.sceneGraphOpen;
  const startSceneResize = useResizablePanel(
    'left',
    preferences.scenePanelWidth,
    (scenePanelWidth) => preferences.update({ scenePanelWidth })
  );
  useEffect(() => {
    const showObjects = () => preferences.update({ sceneGraphOpen: true });
    window.addEventListener('editor-show-in-scene-graph', showObjects);
    return () =>
      window.removeEventListener('editor-show-in-scene-graph', showObjects);
  }, [preferences]);
  useEffect(() => {
    if (searchParams.get('workspace') === 'results') {
      setActiveTab('results');
    }
  }, [searchParams]);
  const scenarioName = useEditorStore((s) => s.Scenario.name);
  const map = useEditorStore((s) => s.simConfig.carla.map);
  const controls = useScenarioControls();
  const isSimulationRunning = useEditorStore(
    (s) => s.simulationSession.phase === 'running'
  );
  const isMapLoading = useEditorStore((s) => s.isMapLoading);
  const isReadOnly = isSimulationRunning || controls.isBusy || isMapLoading;
  useSelectionSceneSync(isReadOnly);

  return (
    <div
      className={`editor-chrome${preferences.compactEditor ? ' editor-chrome--compact' : ''}`}
      data-workspace={activeTab}
      style={
        {
          '--editor-panel-user-width': `${preferences.contextPanelWidth}px`,
          '--editor-scene-user-width': `${preferences.scenePanelWidth}px`,
        } as CSSProperties
      }
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
        {controls.notice ? (
          <span
            className="editor-operation-notice"
            role="status"
            aria-live="polite"
          >
            {controls.notice}
          </span>
        ) : null}
        <EditorToolbar
          readOnly={isReadOnly}
          onWorkspaceChange={setActiveTab}
          onSave={controls.save}
          onToggleScene={() =>
            preferences.update({ sceneGraphOpen: !preferences.sceneGraphOpen })
          }
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
          <SceneTreePanel readOnly={isReadOnly} />
          <div
            className="editor-panel-resize-handle editor-panel-resize-handle--left"
            role="separator"
            aria-label="Resize scene graph panel"
            aria-orientation="vertical"
            onPointerDown={startSceneResize}
          />
        </div>
      )}

      {activeTab === 'edit' && (
        <EditorTransformControls readOnly={isReadOnly} />
      )}

      <Suspense fallback={null}>
        <RightPanel
          activeTab={activeTab}
          onTabChange={setActiveTab}
          controls={controls}
          preferredResultRunId={preferredResultRunId}
          showSceneGraph={false}
          readOnly={isReadOnly}
          collapsed={preferences.rightPanelCollapsed}
          width={preferences.contextPanelWidth}
          onCollapsedChange={(rightPanelCollapsed) =>
            preferences.update({ rightPanelCollapsed })
          }
          onWidthChange={(contextPanelWidth) =>
            preferences.update({ contextPanelWidth })
          }
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
