import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { css, WEATHER_OPTIONS } from './types/StartPageTypes';
import type { CP } from './types/StartPageTypes';
import { useEditorStore } from '../store/useEditorStore';
import { createNewScenario, Scenario } from './components/Inputs/types/Scenario';

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
      x="28" y="37"
      textAnchor="middle"
      fontSize="14"
      fontFamily='"Courier New", Courier, monospace'
      fontWeight="700"
      fill="#69f0ae"
      letterSpacing="1"
    >SM</text>
    <circle cx="28" cy="32" r="25" stroke="rgba(105,240,174,0.1)" strokeWidth="0.5" strokeDasharray="3 9">
      <animateTransform attributeName="transform" type="rotate"
        from="0 28 32" to="360 28 32" dur="14s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const StartPage = () => {
  const [scenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');
  const [weather, setWeather] = useState('ClearNoon');
  const updateScenario = useEditorStore(s => s.updateScenario);

  const kx = 0.086087664180445;
  const ky = 0.087651516713233;

  useEffect(() => {
    if (window.localStorage.getItem('scenario_name') == null)
      createNewScenario();
    else
      setScenarioName(JSON.parse(window.localStorage.getItem('scenario_name')!));

    const storedWeather = window.localStorage.getItem('weather');
    if (storedWeather) setWeather(JSON.parse(storedWeather));
  }, []);

  useEffect(() => {
    window.localStorage.setItem('weather', JSON.stringify(weather));
  }, [weather]);

  const handleChangeName = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScenarioName(event.target.value);
    updateScenario({ name: event.target.value });
    window.localStorage.setItem('scenario_name', JSON.stringify(event.target.value));
  };

  const handleCreateNewScenario = () => {
    setScenarioName('');
    createNewScenario();
  };

  const handleSaveScenario = () => {
    const scen: Scenario = {
      scenario_id:   JSON.parse(window.localStorage.getItem('scenario_id')!),
      scenario_name: JSON.parse(window.localStorage.getItem('scenario_name')!),
      weather:       JSON.parse(window.localStorage.getItem('weather')!),
      scenario:      JSON.parse(window.localStorage.getItem('scenario')!),
    };

    scen.scenario = scen.scenario.map((item) => ({
      vehicle: item.vehicle,
      active:  item.active,
      color:   item.color,
      path:    item.path.map((point) => ({
        x: point.x * kx - 124.13208770751953,
        y: point.y * ky - 79.5,
        z: 0.6,
      })),
    }));

    window.localStorage.setItem('scenario', JSON.stringify(scen.scenario));
  };

  const handleEdit = (index: number) => {
    setScenarioName(scenarios[index].scenario_name);
    updateScenario({
      name:    scenarios[index].scenario_name,
      weather: scenarios[index].weather,
    });
    window.localStorage.setItem('scenario_id',   JSON.stringify(scenarios[index].scenario_id));
    window.localStorage.setItem('scenario_name', JSON.stringify(scenarios[index].scenario_name));
    window.localStorage.setItem('weather',       JSON.stringify(scenarios[index].weather));
    window.localStorage.setItem('scenario',      JSON.stringify(scenarios[index].scenario));
  };

  const handleWeatherChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setWeather(event.target.value);
    updateScenario({ weather: event.target.value });
  };

  return (
    <>
      <style>{css}</style>
      <div className="sm-home-root">
        <div className="sm-home-grid" />
        <div className="sm-home-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map(p => <Corner key={p} pos={p} />)}

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
                value={scenarioName}
                onChange={handleChangeName}
              />
            </div>

            <div className="sm-home-btn-row">
              <button className="sm-home-btn sm-home-btn-primary" onClick={handleCreateNewScenario}>
                + New
              </button>
              <button className="sm-home-btn" onClick={handleSaveScenario}>
                Save
              </button>
            </div>

            {scenarios.length > 0 && (
              <div className="sm-home-scenario-list">
                {scenarios.map((scenario, index) => (
                  <div
                    className="sm-home-scenario-item"
                    key={scenario.scenario_id ?? index}
                    onClick={() => handleEdit(index)}
                  >
                    <span className="sm-home-scenario-name">{scenario.scenario_name}</span>
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
                value={weather}
                onChange={handleWeatherChange}
              >
                {WEATHER_OPTIONS.map(val => (
                  <option key={val} value={val}>{val}</option>
                ))}
              </select>
              <span className="sm-home-select-arrow">&#9662;</span>
            </div>
          </div>

          <div className="sm-home-divider" />

          <Link to="/editor" className="sm-home-editor-link">
            Open Editor &rarr;
          </Link>

        </div>

        <span className="sm-home-stamp">CAVISE &middot; SM &middot; HOME</span>
      </div>
    </>
  );
};

export default StartPage;
