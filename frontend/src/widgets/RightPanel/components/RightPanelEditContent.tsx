import { useEffect, useState } from 'react';
import { NearMeOutlined } from '@mui/icons-material';
import { useEditorStore } from '@/store';
import { useSelectedObject } from '@editor/hooks/useEditorEngine/useSelectedObject';
import type { ScenarioControls } from './ScenarioControlWidget/types/ScenarioControlWidgetTypes';
import CarProperties from './CarProperties';
import LidarProperties from './LidarProperties';
import RSUProperties from './RSUProperties';
import BuildingProperties from './BuildingProperties';
import RoutePointProperties from './RoutePointProperties';
import PedestrianProperties from './PedestrianProperties';
import SceneTreePanel from './SceneTreePanel';
import MultiSelectionProperties from './MultiSelectionProperties/ui/MultiSelectionProperties';
import {
  PropertiesModeContext,
  type PropertiesMode,
} from '../context/PropertiesModeContext';
import { CollapsibleSection } from './CollapsibleSection';
import { ObjectQuickActions } from './ObjectQuickActions';

type Props = {
  showSceneGraph: boolean;
  readOnly: boolean;
  controls: ScenarioControls;
};

export function RightPanelEditContent({
  showSceneGraph,
  readOnly,
  controls,
}: Props) {
  const [propertiesMode, setPropertiesMode] = useState<PropertiesMode>('basic');
  const selectedIds = useEditorStore((state) => state.selectedIds);
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

  useEffect(
    () => setPropertiesMode('basic'),
    [selectedIds.length, selectedObjectId]
  );

  const onDeleteSelected = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));

  return (
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
              <span className="rp-selection-count">
                {selectedIds.length} selected
              </span>
            </div>
            {supportsAdvancedProperties && (
              <>
                <div
                  className="rp-properties-tabs"
                  role="group"
                  aria-label="Property detail level"
                >
                  {(['basic', 'advanced'] as PropertiesMode[]).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      aria-pressed={propertiesMode === mode}
                      className={propertiesMode === mode ? 'active' : ''}
                      onClick={() => setPropertiesMode(mode)}
                    >
                      {mode === 'basic' ? 'Essentials' : 'Advanced'}
                    </button>
                  ))}
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
            <div className="rp-context-id">Object ID: {selectedIds[0]}</div>
          )}
        {selectedIds.length > 1 ? (
          <MultiSelectionProperties readOnly={readOnly || controls.isBusy} />
        ) : (
          <fieldset
            disabled={readOnly || controls.isBusy}
            className="rp-properties-fieldset"
          >
            <PropertiesModeContext.Provider value={propertiesMode}>
              {!hasSelection && (
                <div className="rp-empty">
                  <NearMeOutlined aria-hidden="true" />
                  <span className="rp-empty-text">Select an object</span>
                  <p>
                    Choose an object in the scene or the object list to edit its
                    properties.
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
                <LidarProperties lidar={lidar} onDelete={onDeleteSelected} />
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
        <CollapsibleSection label="Quick Actions" defaultOpen>
          {selectedObjectId && (
            <ObjectQuickActions objectId={selectedObjectId} />
          )}
        </CollapsibleSection>
      )}
    </>
  );
}
