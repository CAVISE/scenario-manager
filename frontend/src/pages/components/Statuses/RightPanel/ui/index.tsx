import { useState } from 'react';
import type { RightPanelProps } from '../types/PanelTypes';
import { useSelectedObject } from "../../../../Editor/hooks/useSelectedObject";

import CarProperties from '../components/CarProperties/ui/CarProperties';
import LidarProperties from '../components/LidarProperties/ui/LidarProperties';
import RSUProperties from '../components/RSUProperties/ui/RSUProperties';
import BuildingProperties from '../components/BuildingProperties/ui/BuildingProperties';
import RoutePointProperties from '../components/RoutePointProperties/ui/RoutePointProperties';
import type { SectionProps } from '../types/PanelTypes';
import {css} from '../types/PanelTypes'
import PedestrianProperties from '../components/PedestrianProperties/ui/PedestrianProperties';
import ScenarioControlWidget from '../components/ScenarioControlWidget/ui/ScenarioControlWidget';
import { useEditorStore } from '../../../../../store/useEditorStore';
import SceneTreePanel from '../components/SceneTreePanel/ui/SceneTreePanel';


const Section: React.FC<SectionProps> = ({ label, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rp-section">
      <div className="rp-section-header" onClick={() => setIsOpen(v => !v)}>
        <span className="rp-section-label">{label}</span>
        <span className={`rp-section-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && <div className="rp-section-content">{children}</div>}
    </div>
  );
};

export default function RightPanel({
  sceneGraph, onDetach, updateSceneGraph}: RightPanelProps) {
  const removeLidar = useEditorStore(s=>s.removeLidar)
  const onSelectObject = useEditorStore(s=>s.selectObject)
  const [collapsed, setCollapsed] = useState(false);
  const setChangePanelMode = useEditorStore(s => s.setChangePanelMode)
  const selectedObject = useEditorStore(s => s.selectedObject);
  const {
    car, rsu, building, lidar, point,
    isCar, isRSU, isCircle, isBuilding, isLidar, hasSelection, isPedestrian, pedestrian
  } = useSelectedObject(selectedObject);

  const onDeleteSelected = () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))

  return (
    <>
      <style>{css}</style>

      <button
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => { setCollapsed(v => !v); setChangePanelMode(); }}
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
            onSelectObject={onSelectObject}
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
              <CarProperties car={car} onDelete={onDeleteSelected} onDetach={onDetach} />
            )}
            {isRSU && rsu && (
              <RSUProperties rsu={rsu} onDelete={onDeleteSelected} />
            )}
            {isCircle && point ? (
              <RoutePointProperties point={point}selectedObject={selectedObject} onDelete={onDeleteSelected} />
            ): null}
            {isBuilding && building && (
              <BuildingProperties building={building} onDelete={onDeleteSelected} />
            )}
            {isLidar && lidar && (
              <LidarProperties lidar={lidar} onDelete={() => { removeLidar(lidar.id);onDetach(); }} />
            )}
            {isPedestrian && pedestrian && (
              <PedestrianProperties pedestrian={pedestrian} onDelete={onDeleteSelected} />
            )}
          </Section>

          <Section label="Scenario Manager" defaultOpen={true}>
            <ScenarioControlWidget updateSceneGraph={updateSceneGraph}/>
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
