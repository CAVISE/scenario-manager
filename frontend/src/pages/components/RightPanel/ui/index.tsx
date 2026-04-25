import { useState } from 'react';
import { useSelectedObject } from '../../../Editor/hooks/useEditorEngine/useSelectedObject';

import CarProperties from '../components/CarProperties';
import LidarProperties from '../components/LidarProperties';
import RSUProperties from '../components/RSUProperties';
import BuildingProperties from '../components/BuildingProperties';
import RoutePointProperties from '../components/RoutePointProperties';
import type { SectionProps } from '../types/PanelTypes';
import { css } from '../types/PanelTypes';
import PedestrianProperties from '../components/PedestrianProperties';
import ScenarioControlWidget from '../components/ScenarioControlWidget';
import { useEditorStore } from '../../../../store';
import SceneTreePanel from '../components/SceneTreePanel';

const Section: React.FC<SectionProps> = ({
  label,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rp-section">
      <div className="rp-section-header" onClick={() => setIsOpen((v) => !v)}>
        <span className="rp-section-label">{label}</span>
        <span className={`rp-section-chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      {isOpen && <div className="rp-section-content">{children}</div>}
    </div>
  );
};

export default function RightPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const setChangePanelMode = useEditorStore((s) => s.setChangePanelMode);
  const {
    car,
    rsu,
    building,
    lidar,
    point,
    isCar,
    isRSU,
    isCircle,
    isBuilding,
    isLidar,
    hasSelection,
    isPedestrian,
    pedestrian,
  } = useSelectedObject();

  const onDeleteSelected = () =>
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
  return (
    <>
      <style>{css}</style>

      <button
        className={`rp-toggle ${collapsed ? '' : 'open'}`}
        onClick={() => {
          setCollapsed((v) => !v);
          setChangePanelMode();
        }}
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
            <SceneTreePanel />
          </Section>

          <Section label="Properties">
            {!hasSelection && (
              <div className="rp-empty">
                <div className="rp-empty-icon">○</div>
                <span className="rp-empty-text">No selected object</span>
              </div>
            )}
            {isCar && car && (
              <CarProperties car={car} onDelete={onDeleteSelected} />
            )}
            {isRSU && rsu && (
              <RSUProperties rsu={rsu} onDelete={onDeleteSelected} />
            )}
            {isCircle && point ? (
              <RoutePointProperties point={point} onDelete={onDeleteSelected} />
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
          </Section>

          <Section label="Scenario Manager" defaultOpen={true}>
            <ScenarioControlWidget />
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
