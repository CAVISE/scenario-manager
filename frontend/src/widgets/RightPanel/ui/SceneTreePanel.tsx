import { useEffect, useState } from 'react';

import CarProperties from '../components/CarProperties';
import LidarProperties from '../components/LidarProperties';
import RSUProperties from '../components/RSUProperties';
import BuildingProperties from '../components/BuildingProperties';
import RoutePointProperties from '../components/RoutePointProperties';
import type { RightPanelProps } from '../types/PanelTypes';
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
import { CollapsibleSection } from '../components/CollapsibleSection';
import { RightPanelHeader } from '../components/RightPanelHeader';
import { ObjectQuickActions } from '../components/ObjectQuickActions';
import { RightPanelFooter } from '../components/RightPanelFooter';

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
  const selectedObjectId = selectedIds[0];
  const supportsAdvancedProperties = isCar || isRSU || isLidar || isPedestrian;

  useEffect(() => {
    setPropertiesMode('basic');
  }, [selectedIds.length, selectedObjectId]);

  const onDeleteSelected = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
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
            <>
              {showSceneGraph && (
                <CollapsibleSection label="Objects">
                  <SceneTreePanel readOnly={readOnly} />
                </CollapsibleSection>
              )}

              <CollapsibleSection label="Properties">
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
                    {supportsAdvancedProperties && (
                      <>
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
                                className={
                                  propertiesMode === mode ? 'active' : ''
                                }
                                onClick={() => setPropertiesMode(mode)}
                              >
                                {mode === 'basic' ? 'Essentials' : 'Advanced'}
                              </button>
                            )
                          )}
                        </div>
                        <p className="rp-properties-hint">
                          {propertiesMode === 'basic'
                            ? 'Common settings for this object.'
                            : 'Runtime, sensing, and integration settings.'}
                        </p>
                      </>
                    )}
                  </div>
                )}

                {propertiesMode === 'advanced' &&
                  supportsAdvancedProperties &&
                  selectedIds.length === 1 && (
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
              </CollapsibleSection>

              {hasSelection && selectedIds.length === 1 && (
                <CollapsibleSection label="Quick Actions" defaultOpen={true}>
                  {selectedObjectId && (
                    <ObjectQuickActions objectId={selectedObjectId} />
                  )}
                </CollapsibleSection>
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

        <RightPanelFooter readOnly={readOnly} connected={connected} />
      </div>
      <SimConfigModal
        open={simConfigOpen && !readOnly && !controls.isBusy}
        onClose={() => setSimConfigOpen(false)}
      />
    </>
  );
}
