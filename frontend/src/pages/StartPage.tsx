import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CP, css, WEATHER_OPTIONS } from './StartPage.types';
import { useEditorStore } from '../store';
import {
  useScenariosListQuery,
  useScenarioCreateMutation,
  useScenarioPatchMutation,
} from './editor/hooks/useScenarioQueries';
import {
  handleCreate,
  handlePatch,
} from './editor/right-panel/ScenarioControlWidget/handlers';
import type { ScenarioListItem } from '../api/scenario.types';
import { getApiErrorMessageSync } from '../api/errors';

const Corner: React.FC<{ pos: CP }> = ({ pos }) => (
  <div className={`sm-home-corner sm-home-corner-${pos}`} />
);

const HexLogo: React.FC = () => (
  <svg width="56" height="64" viewBox="0 0 56 64" fill="none">
    <polygon
      points="28,3 53,17 53,47 28,61 3,47 3,17"
      stroke="rgba(105,240,174,0.35)"
      strokeWidth="1"
      fill="none"
    />
    <polygon
      points="28,11 45,21 45,43 28,53 11,43 11,21"
      stroke="rgba(105,240,174,0.12)"
      strokeWidth="1"
      fill="rgba(105,240,174,0.03)"
    />
    <text
      x="28"
      y="37"
      textAnchor="middle"
      fontSize="14"
      fontFamily='"Courier New", Courier, monospace'
      fontWeight="700"
      fill="#69f0ae"
      letterSpacing="1"
    >
      SM
    </text>
    <circle
      cx="28"
      cy="32"
      r="25"
      stroke="rgba(105,240,174,0.1)"
      strokeWidth="0.5"
      strokeDasharray="3 9"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 28 32"
        to="360 28 32"
        dur="14s"
        repeatCount="indefinite"
      />
    </circle>
  </svg>
);

const StartPage = () => {
  const navigate = useNavigate();
  const scenario = useEditorStore((s) => s.Scenario);
  const updateScenario = useEditorStore((s) => s.updateScenario);
  const [notice, setNotice] = useState('');

  const {
    data: scenarios = [],
    isLoading,
    isError,
    error,
  } = useScenariosListQuery(true);
  const createMutation = useScenarioCreateMutation();
  const patchMutation = useScenarioPatchMutation();
  const isSaving = createMutation.isPending || patchMutation.isPending;

  const resetStore = () => {
    const s = useEditorStore.getState();
    [...s.cars].forEach((c) => s.removeCar(c.id));
    s.removeAllRSUs();
    [...s.points].forEach((p) => s.removePoint(p.id));
    [...s.buildings].forEach((b) => s.removeBuilding(b.id));
    [...s.pedestrians].forEach((p) => s.removePedestrian(p.id));
    [...s.lidars].forEach((l) => s.removeLidar(l.id));
    s.removeSelectedId();
    s.updateScenario({
      id: '',
      name: 'New Scenario',
      weather: 'ClearNoon',
      description: '',
      file_: null,
    });
  };

  const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateScenario({ name: event.target.value });
  };

  const handleCreateNewScenario = () => {
    resetStore();
    navigate('/editor');
  };

  const handleSaveScenario = () => {
    if (!scenario.name.trim()) {
      setNotice('Scenario name is required.');
      return;
    }
    if (scenario.id) {
      handlePatch(setNotice, scenario.id, true, patchMutation);
    } else {
      handleCreate(setNotice, createMutation);
    }
  };

  const handleOpenScenario = (item: ScenarioListItem) => {
    navigate(`/editor?scenario=${encodeURIComponent(item.scenario_id)}`);
  };

  const handleWeatherChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    updateScenario({ weather: event.target.value });
  };
  return (
    <>
      <style>{css}</style>
      <div className="sm-home-root">
        <div className="sm-home-grid" />
        <div className="sm-home-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
          <Corner key={p} pos={p} />
        ))}

        <div className="sm-home-card">
          <div className="sm-home-logo-wrap">
            <HexLogo />
            <div className="sm-home-title-block">
              <span className="sm-home-subtitle">CAVISE / V2X SIM</span>
              <span className="sm-home-title">ScenarioManager</span>
            </div>
          </div>

          <div className="sm-home-divider" />

          <div className="sm-home-scenarios">
            <div className="sm-home-section-label">
              <span className="sm-home-section-dot" />
              Scenarios
            </div>

            <div className="sm-home-input-row">
              <input
                className="sm-home-input"
                placeholder="Scenario name"
                value={scenario.name}
                onChange={handleChangeName}
              />
            </div>

            {notice ? <div className="sm-home-notice">{notice}</div> : null}

            <div className="sm-home-btn-row">
              <button
                className="sm-home-btn sm-home-btn-primary"
                onClick={handleCreateNewScenario}
              >
                + New
              </button>
              <button
                className="sm-home-btn"
                onClick={handleSaveScenario}
                disabled={isSaving}
              >
                {isSaving ? 'Saving…' : 'Save'}
              </button>
            </div>

            {isError ? (
              <div className="sm-home-notice">
                {getApiErrorMessageSync(error, 'Failed to load scenarios.')}
              </div>
            ) : null}

            {isLoading ? (
              <div className="sm-home-scenario-loading">Loading…</div>
            ) : null}

            {!isLoading && scenarios.length > 0 && (
              <div className="sm-home-scenario-list">
                {scenarios.map((item) => (
                  <div
                    className="sm-home-scenario-item"
                    key={item.scenario_id}
                    onClick={() => handleOpenScenario(item)}
                  >
                    <span className="sm-home-scenario-name">{item.name}</span>
                    <span className="sm-home-scenario-arrow">&rarr;</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="sm-home-divider" />

          <div className="sm-home-weather">
            <div className="sm-home-section-label">
              <span className="sm-home-section-dot" />
              World Parameters
            </div>

            <div className="sm-home-select-wrap">
              <select
                className="sm-home-select"
                value={scenario.weather}
                onChange={handleWeatherChange}
              >
                {WEATHER_OPTIONS.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
              <span className="sm-home-select-arrow">&#9662;</span>
            </div>
          </div>

          <div className="sm-home-divider" />

          <Link
            to="/editor"
            className="sm-home-editor-link"
            data-testid="open-editor"
          >
            Open Editor →
          </Link>
        </div>

        <span className="sm-home-stamp">CAVISE &middot; SM &middot; HOME</span>
      </div>
    </>
  );
};

export default StartPage;
