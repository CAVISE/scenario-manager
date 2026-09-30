import { useEffect, useId, useState } from 'react';

import CarProperties from '../components/CarProperties';
import LidarProperties from '../components/LidarProperties';
import RSUProperties from '../components/RSUProperties';
import BuildingProperties from '../components/BuildingProperties';
import RoutePointProperties from '../components/RoutePointProperties';
import type { RightPanelProps, SectionProps } from '../types/PanelTypes';
import '../styles/RightPanel.scss';
import PedestrianProperties from '../components/PedestrianProperties';
import { useEditorStore } from '@/store';
import SceneTreePanel from '../components/SceneTreePanel';
import { useSelectedObject } from '@editor/hooks/useEditorEngine/useSelectedObject';
import { useSimulationSocket } from '@editor/hooks/useApiHooks/useSimulationSocket';
import ScenarioControlWidget from '../components/ScenarioControlWidget';
import MultiSelectionProperties from '../components/MultiSelectionProperties/ui/MultiSelectionProperties';
import SimConfigModal from '@/features/simulation-config';
import {
  PropertiesModeContext,
  type PropertiesMode,
} from '../context/PropertiesModeContext';
import { WorkspaceContent } from '../components/WorkspaceContent';
import { NearMeOutlined } from '@mui/icons-material';

const Section: React.FC<SectionProps> = ({
  label,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const sectionId = useId();

  return (
    <div className="rp-section">
      <button
        type="button"
        className="rp-section-header"
        aria-expanded={isOpen}
        aria-controls={sectionId}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="rp-section-label">{label}</span>
        <span
          aria-hidden="true"
          className={`rp-section-chevron ${isOpen ? 'open' : ''}`}
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <div id={sectionId} className="rp-section-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default function RightPanel({
  activeTab = 'edit',
  showSceneGraph = true,
  readOnly = false,
  controls,
  onTabChange,
  preferredResultRunId,
}: RightPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => setCollapsed(false), [activeTab]);
  const [panelMode, setPanelMode] = useState<'properties' | 'context'>(
    'properties'
  );
  const [simConfigOpen, setSimConfigOpen] = useState(false);
  const { connected } = useSimulationSocket();
  const scenarioName = useEditorStore((s) => s.Scenario.name);
  const [propertiesMode, setPropertiesMode] = useState<PropertiesMode>('basic');
  const setChangePanelMode = useEditorStore((s) => s.setChangePanelMode);
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const {
    car,
    carLidars,
    rsu,
    building,
    lidar,
    point,
    isCar,
    isRSU,
    isRoutePoint,
    isBuilding,
    isLidar,
    hasSelection,
    isPedestrian,
    pedestrian,
  } = useSelectedObject();

  const onDeleteSelected = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
  const dispatchObjectAction = (name: string) => {
    const id = selectedIds[0];
    if (id) window.dispatchEvent(new CustomEvent(name, { detail: { id } }));
  };
  return (
    <>
      <button
        type="button"
        aria-label={collapsed ? 'Show context panel' : 'Hide context panel'}
        aria-expanded={!collapsed}
        aria-controls="editor-workspace-panel"
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => {
          setCollapsed((v) => !v);
          setChangePanelMode();
        }}
      >
        <span className="rp-toggle-arrow">❯</span>
      </button>

      <div
        className={`rp-root ${collapsed ? 'collapsed' : ''}`}
        aria-hidden={collapsed}
      >
        <div className="rp-header">
          <div className="rp-header-row">
            <span className="rp-title">
              {activeTab === 'edit'
                ? 'Inspector'
                : activeTab === 'simulation'
                  ? 'Simulation'
                  : 'Results'}
            </span>
            <span className="rp-badge">V2X</span>
          </div>
          <div className="rp-subtitle">
            {scenarioName || 'Untitled scenario'}
          </div>
          {activeTab === 'edit' && (
            <div
              className="rp-panel-switcher"
              role="group"
              aria-label="Inspector view"
            >
              <button
                type="button"
                aria-pressed={panelMode === 'properties'}
                onClick={() => setPanelMode('properties')}
              >
                Properties
              </button>
              <button
                type="button"
                aria-pressed={panelMode === 'context'}
                onClick={() => setPanelMode('context')}
              >
                Context
              </button>
            </div>
          )}
        </div>

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
            <>
              {showSceneGraph && (
                <Section label="Objects">
                  <SceneTreePanel readOnly={readOnly} />
                </Section>
              )}

              <Section label="Properties">
                {selectedIds.length > 0 && (
                  <div className="rp-properties-toolbar">
                    <div className="rp-properties-heading">
                      <span className="rp-properties-title">Selection</span>
                      {selectedIds.length > 0 && (
                        <span className="rp-selection-count">
                          {selectedIds.length} selected
                        </span>
                      )}
                    </div>
                    <div
                      className="rp-properties-tabs"
                      role="group"
                      aria-label="Property detail level"
                    >
                      {(['basic', 'advanced'] as PropertiesMode[]).map(
                        (mode) => (
                          <button
                            key={mode}
                            type="button"
                            aria-pressed={propertiesMode === mode}
                            className={propertiesMode === mode ? 'active' : ''}
                            onClick={() => setPropertiesMode(mode)}
                          >
                            {mode === 'basic' ? 'Basic' : 'Advanced'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                )}

                {propertiesMode === 'advanced' && selectedIds.length === 1 && (
                  <div className="rp-context-id">
                    Object ID: {selectedIds[0]}
                  </div>
                )}
                {selectedIds.length > 1 ? (
                  <MultiSelectionProperties
                    readOnly={readOnly || controls.isBusy}
                  />
                ) : (
                  <fieldset
                    disabled={readOnly || controls.isBusy}
                    className="rp-properties-fieldset"
                  >
                    <PropertiesModeContext.Provider value={propertiesMode}>
                      {!hasSelection && (
                        <div className="rp-empty">
                          <NearMeOutlined aria-hidden="true" />
                          <span className="rp-empty-text">
                            Select an object
                          </span>
                          <p>
                            Choose an object in the scene or the object list to
                            edit its properties.
                          </p>
                        </div>
                      )}
                      {isCar && car && (
                        <CarProperties
                          car={car}
                          carLidars={carLidars}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isRSU && rsu && (
                        <RSUProperties rsu={rsu} onDelete={onDeleteSelected} />
                      )}
                      {isRoutePoint && point ? (
                        <RoutePointProperties
                          point={point}
                          onDelete={onDeleteSelected}
                        />
                      ) : null}
                      {isBuilding && building && (
                        <BuildingProperties
                          building={building}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isLidar && lidar && (
                        <LidarProperties
                          lidar={lidar}
                          onDelete={onDeleteSelected}
                        />
                      )}
                      {isPedestrian && pedestrian && (
                        <PedestrianProperties
                          pedestrian={pedestrian}
                          onDelete={onDeleteSelected}
                        />
                      )}
                    </PropertiesModeContext.Provider>
                  </fieldset>
                )}
              </Section>

              {hasSelection && selectedIds.length === 1 && (
                <Section label="Quick Actions" defaultOpen={true}>
                  <div className="rp-quick-actions">
                    <button
                      type="button"
                      className="rp-quick-action"
                      onClick={() =>
                        dispatchObjectAction('editor-focus-object')
                      }
                    >
                      <span aria-hidden="true">⌖</span>
                      Focus on object
                    </button>
                    <button
                      type="button"
                      className="rp-quick-action"
                      onClick={() =>
                        dispatchObjectAction('editor-show-in-scene-graph')
                      }
                    >
                      <span aria-hidden="true">☷</span>
                      Show in Scene Graph
                    </button>
                  </div>
                </Section>
              )}
            </>
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

        <div className="rp-footer">
          <span>
            {readOnly ? 'Simulation running · View only' : 'Scenario Manager'}
          </span>
          <span
            className={`rp-connection${connected ? ' connected' : ''}`}
            title={
              connected
                ? 'Live status connected'
                : 'Reconnecting to status channel'
            }
          >
            <span className="rp-footer-dot" />
            {connected ? 'Connected' : 'Reconnecting'}
          </span>
        </div>
      </div>
      <SimConfigModal
        open={simConfigOpen && !readOnly && !controls.isBusy}
        onClose={() => setSimConfigOpen(false)}
      />
    </>
  );
}
