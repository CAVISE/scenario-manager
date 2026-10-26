import { useState } from 'react';
import type { RightPanelProps } from '../types/PanelTypes';
import '../styles/RightPanel.scss';
import { useEditorStore } from '@/store';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import ScenarioControlWidget from '../components/ScenarioControlWidget';
import SimConfigModal from '@/features/simulation-config';
import { WorkspaceContent } from '../components/WorkspaceContent';
import { RightPanelHeader } from '../components/RightPanelHeader';
import { RightPanelFooter } from '../components/RightPanelFooter';
import { useResizablePanel } from '@widgets/EditorUI/model/useResizablePanel';
import { RightPanelEditContent } from '../components/RightPanelEditContent';

export default function RightPanel({
  activeTab = 'edit',
  showSceneGraph = true,
  readOnly = false,
  collapsed = false,
  width = 332,
  onCollapsedChange = () => {},
  onWidthChange = () => {},
  controls,
  onTabChange,
  preferredResultRunId,
}: RightPanelProps) {
  const startResize = useResizablePanel('right', width, onWidthChange);
  const [panelMode, setPanelMode] = useState<'properties' | 'context'>(
    'properties'
  );
  const [simConfigOpen, setSimConfigOpen] = useState(false);
  const { connected } = useSimulationSocket();
  const scenarioName = useEditorStore((s) => s.Scenario.name);
  const setChangePanelMode = useEditorStore((s) => s.setChangePanelMode);
  return (
    <>
      <button
        type="button"
        aria-label={collapsed ? 'Show context panel' : 'Hide context panel'}
        aria-expanded={!collapsed}
        aria-controls="editor-workspace-panel"
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => {
          onCollapsedChange(!collapsed);
          setChangePanelMode();
        }}
      >
        <span className="rp-toggle-arrow">❯</span>
      </button>

      <div
        className={`rp-root ${collapsed ? 'collapsed' : ''}`}
        aria-hidden={collapsed}
      >
        <div
          className="rp-resize-handle"
          role="separator"
          aria-label="Resize context panel"
          aria-orientation="vertical"
          onPointerDown={startResize}
        />
        <RightPanelHeader
          activeTab={activeTab}
          scenarioName={scenarioName}
          panelMode={panelMode}
          onPanelModeChange={setPanelMode}
        />

        <div
          className="rp-body"
          id="editor-workspace-panel"
          role="tabpanel"
          aria-label={
            activeTab === 'edit' ? 'Edit workspace' : `${activeTab} workspace`
          }
        >
          {activeTab === 'edit' && panelMode === 'context' ? (
            <ScenarioControlWidget
              key="context"
              controls={controls}
              readOnly={readOnly}
              onOpenSimulation={() => onTabChange('simulation')}
              onOpenResults={() => onTabChange('results')}
              onOpenSettings={() => setSimConfigOpen(true)}
            />
          ) : activeTab === 'edit' ? (
            <RightPanelEditContent
              showSceneGraph={showSceneGraph}
              readOnly={readOnly}
              controls={controls}
            />
          ) : (
            <WorkspaceContent
              key={activeTab}
              tab={activeTab}
              controls={controls}
              connected={connected}
              onOpenResults={() => onTabChange('results')}
              preferredResultRunId={preferredResultRunId}
              onOpenContext={() => {
                setPanelMode('context');
                onTabChange('edit');
              }}
            />
          )}
        </div>

        <RightPanelFooter readOnly={readOnly} connected={connected} />
      </div>
      <SimConfigModal
        open={simConfigOpen && !readOnly && !controls.isBusy}
        onClose={() => setSimConfigOpen(false)}
      />
    </>
  );
}
