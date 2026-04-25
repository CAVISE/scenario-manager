export type CP = 'tl' | 'tr' | 'bl' | 'br';

export const WEATHER_OPTIONS = [
  'ClearNoon',
  'CloudyNoon',
  'WetNoon',
  'WetCloudyNoon',
  'SoftRainNoon',
  'MidRainyNoon',
  'HardRainNoon',
  'ClearSunset',
  'CloudySunset',
  'WetSunset',
  'WetCloudySunset',
  'SoftRainSunset',
  'MidRainSunset',
  'HardRainSunset',
] as const;

export const css = `
  .sm-home-root {
    position: fixed;
    inset: 0;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #080c10;
    overflow-y: auto;
    font-family: "Courier New", Courier, monospace;
  }

  .sm-home-grid {
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(105,240,174,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(105,240,174,0.035) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: smhGridScroll 10s linear infinite;
    pointer-events: none;
  }

  .sm-home-scan {
    position: fixed;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(105,240,174,0.55) 50%, transparent 100%);
    animation: smhScan 4s ease-in-out infinite;
    pointer-events: none;
  }

  .sm-home-corner {
    position: fixed;
    width: 20px;
    height: 20px;
  }
  .sm-home-corner-tl { top: 28px; left: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .sm-home-corner-tr { top: 28px; right: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }
  .sm-home-corner-bl { bottom: 28px; left: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .sm-home-corner-br { bottom: 28px; right: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }

  .sm-home-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    padding: 40px 0;
    animation: smhFadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both;
  }

  .sm-home-logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .sm-home-title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .sm-home-subtitle {
    font-size: 10px;
    letter-spacing: 0.42em;
    color: rgba(105,240,174,0.45);
    text-transform: uppercase;
  }
  .sm-home-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #fff;
    text-transform: uppercase;
  }

  .sm-home-divider {
    width: 320px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(105,240,174,0.2), transparent);
  }

  /* --- Section headers --- */
  .sm-home-section-label {
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(105,240,174,0.45);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sm-home-section-dot {
    display: inline-block;
    width: 4px; height: 4px;
    border-radius: 50%;
    background: #69f0ae;
  }

  /* --- Scenario section --- */
  .sm-home-scenarios {
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sm-home-input-row {
    display: flex;
    gap: 8px;
    align-items: center;
  }
  .sm-home-input {
    flex: 1;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(105,240,174,0.15);
    color: #fff;
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    padding: 8px 12px;
    outline: none;
    transition: border-color 0.2s;
  }
  .sm-home-input:focus {
    border-color: rgba(105,240,174,0.5);
  }
  .sm-home-input::placeholder {
    color: rgba(255,255,255,0.2);
  }

  .sm-home-btn-row {
    display: flex;
    gap: 8px;
  }

  .sm-home-btn {
    flex: 1;
    background: transparent;
    border: 1px solid rgba(105,240,174,0.25);
    color: rgba(105,240,174,0.8);
    font-family: "Courier New", Courier, monospace;
    font-size: 10px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 8px 14px;
    cursor: pointer;
    transition: all 0.2s;
  }
  .sm-home-btn:hover {
    background: rgba(105,240,174,0.08);
    border-color: rgba(105,240,174,0.5);
    color: #69f0ae;
  }
  .sm-home-btn-primary {
    background: rgba(105,240,174,0.08);
    border-color: rgba(105,240,174,0.4);
  }

  .sm-home-scenario-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 160px;
    overflow-y: auto;
  }
  .sm-home-scenario-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(105,240,174,0.07);
    cursor: pointer;
    transition: all 0.2s;
  }
  .sm-home-scenario-item:hover {
    background: rgba(105,240,174,0.05);
    border-color: rgba(105,240,174,0.2);
  }
  .sm-home-scenario-name {
    font-size: 11px;
    color: rgba(255,255,255,0.7);
    letter-spacing: 0.04em;
  }
  .sm-home-scenario-arrow {
    font-size: 10px;
    color: rgba(105,240,174,0.3);
  }

  /* --- Weather section --- */
  .sm-home-weather {
    width: 320px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sm-home-select-wrap {
    position: relative;
  }
  .sm-home-select {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(105,240,174,0.15);
    color: #fff;
    font-family: "Courier New", Courier, monospace;
    font-size: 12px;
    padding: 8px 12px;
    appearance: none;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .sm-home-select:focus {
    border-color: rgba(105,240,174,0.5);
  }
  .sm-home-select option {
    background: #0d1117;
    color: #fff;
  }
  .sm-home-select-arrow {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 8px;
    color: rgba(105,240,174,0.4);
    pointer-events: none;
  }

  /* --- Editor link --- */
  .sm-home-editor-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(105,240,174,0.06);
    border: 1px solid rgba(105,240,174,0.3);
    color: #69f0ae;
    font-family: "Courier New", Courier, monospace;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 10px 24px;
    cursor: pointer;
    transition: all 0.25s;
  }
  .sm-home-editor-link:hover {
    background: rgba(105,240,174,0.12);
    border-color: #69f0ae;
    box-shadow: 0 0 12px rgba(105,240,174,0.15);
  }

  .sm-home-stamp {
    position: fixed;
    bottom: 20px;
    font-size: 9px;
    letter-spacing: 0.28em;
    color: rgba(255,255,255,0.1);
    text-transform: uppercase;
  }

  @keyframes smhGridScroll {
    from { background-position: 0 0; }
    to   { background-position: 0 64px; }
  }
  @keyframes smhScan {
    0%   { top: 0%;   opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes smhFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
