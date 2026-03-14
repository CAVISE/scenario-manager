import { useState } from 'react';
import type { RightPanelProps } from '../types/PanelTypes';
import { useSelectedObject } from "../../../../Editor/hooks/useSelectedObject";
import SceneTreePanel        from '../components/SceneTreePanel';
import CarProperties         from '../components/CarProperties';
import LidarProperties       from '../components/LidarProperties';
import RSUProperties         from '../components/RSUProperties';
import BuildingProperties    from '../components/BuildingProperties';
import RoutePointProperties  from '../components/RoutePointProperties';
import type { SectionProps } from '../types/PanelTypes';
import {css} from '../types/PanelTypes'


const Section: React.FC<SectionProps> = ({ label, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rp-section">
      <div className="rp-section-header" onClick={() => setOpen(v => !v)}>
        <span className="rp-section-label">{label}</span>
        <span className={`rp-section-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="rp-section-content">{children}</div>}
    </div>
  );
};

export default function RightPanel({
  sceneGraph, onDetach, onDeleteCube,
  selectedObject, onDeleteSelected, sceneRef, transformControlsRef, onSelectObject, pointsArrRef, carMeshesRef
}: RightPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  const {
    car, rsu, building, lidar,
    isCar, isRSU, isCircle, isBuilding, isLidar, hasSelection,
  } = useSelectedObject(selectedObject);

  const handleDeleteCar = () => {
    onDeleteCube();
    onDetach();
  };

  return (
    <>
      <style>{css}</style>

      <button
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => setCollapsed(v => !v)}
      >
        <span className="rp-toggle-arrow">❯</span>
      </button>

      <div className={`rp-root ${collapsed ? 'collapsed' : ''}`}>
        <div className="rp-corner rp-corner-tl" />
        <div className="rp-corner rp-corner-tr" />
        <div className="rp-corner rp-corner-bl" />
        <div className="rp-corner rp-corner-br" />

        <div className="rp-header">
          <div className="rp-header-row">
            <span className="rp-title">Settings</span>
            <span className="rp-badge">V2X</span>
          </div>
          <div className="rp-subtitle">ScenarioManager · CAVISE · 2025</div>
        </div>

        <div className="rp-body">
          <Section label="Objects">
            <SceneTreePanel
            sceneGraph={sceneGraph}
            onDetach={onDetach}
            sceneRef={sceneRef}
            transformControlsRef={transformControlsRef}
            onSelectObject={onSelectObject}
            pointsArrRef={pointsArrRef}
            carMeshesRef={carMeshesRef}
          />
          </Section>

          <Section label="Properties">
            {!hasSelection && (
              <div className="rp-empty">
                <div className="rp-empty-icon">○</div>
                <span className="rp-empty-text">No selected object</span>
              </div>
            )}
            {isCar && car && (
              <CarProperties car={car} onDelete={handleDeleteCar} onDetach={onDetach} />
            )}
            {isRSU && rsu && (
              <RSUProperties rsu={rsu} onDelete={onDeleteSelected} />
            )}
            {isCircle && (
              <RoutePointProperties selectedObject={selectedObject} onDelete={onDeleteSelected} />
            )}
            {isBuilding && building && (
              <BuildingProperties building={building} onDelete={onDeleteSelected} />
            )}
            {isLidar && lidar && (
              <LidarProperties lidar={lidar} onDelete={() => { onDetach(); }} />
            )}
          </Section>
        </div>

        <div className="rp-footer">
          <span>BUILD 2025</span>
          <div className="rp-footer-dot" />
        </div>
      </div>
    </>
  );
}