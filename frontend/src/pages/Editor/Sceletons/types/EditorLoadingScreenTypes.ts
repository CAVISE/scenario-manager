export interface EditorLoadingScreenProps {
  text: string | null;
  progress?: number;
}
export type CP = 'tl' | 'tr' | 'bl' | 'br';
export const css = `
  .sm-loader-root {
    position: fixed;
    inset: 0;
    z-index: 20000;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #080c10;
    overflow: hidden;
    font-family: "Courier New", Courier, monospace;
  }

  /* Grid */
  .sm-loader-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(105,240,174,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(105,240,174,0.035) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: smGridScroll 10s linear infinite;
    pointer-events: none;
  }

  /* Scanline */
  .sm-loader-scan {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(105,240,174,0.55) 50%, transparent 100%);
    animation: smScan 4s ease-in-out infinite;
    pointer-events: none;
  }

  /* Corners */
  .sm-corner {
    position: absolute;
    width: 20px;
    height: 20px;
  }
  .sm-corner-tl { top: 28px; left: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .sm-corner-tr { top: 28px; right: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }
  .sm-corner-bl { bottom: 28px; left: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .sm-corner-br { bottom: 28px; right: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }

  /* Card */
  .sm-loader-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    animation: smFadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both;
  }

  /* Logo row */
  .sm-loader-logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .sm-loader-title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .sm-loader-subtitle {
    font-size: 10px;
    letter-spacing: 0.42em;
    color: rgba(105,240,174,0.45);
    text-transform: uppercase;
  }
  .sm-loader-title {
    font-size: 26px;
    font-weight: 700;
    letter-spacing: 0.14em;
    color: #fff;
    text-transform: uppercase;
  }

  /* Divider */
  .sm-loader-divider {
    width: 280px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(105,240,174,0.2), transparent);
  }

  /* Progress */
  .sm-loader-progress-wrap {
    width: 300px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .sm-loader-bar-track {
    height: 2px;
    background: rgba(255,255,255,0.07);
    position: relative;
    overflow: hidden;
  }
  .sm-loader-bar-fill {
    position: absolute;
    inset-block: 0;
    left: 0;
    background: linear-gradient(90deg, #69f0ae, #40c4ff);
    transition: width 0.45s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 0 8px rgba(105,240,174,0.5);
  }
  .sm-loader-bar-shimmer {
    position: absolute;
    inset-block: 0;
    width: 50px;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
    animation: smShimmer 2s ease-in-out infinite;
  }
  .sm-loader-status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .sm-loader-status-text {
    font-size: 10px;
    color: rgba(105,240,174,0.7);
    letter-spacing: 0.07em;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .sm-loader-dot {
    display: inline-block;
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #69f0ae;
    animation: smPulse 1.3s ease-in-out infinite;
    flex-shrink: 0;
  }
  .sm-loader-pct {
    font-size: 10px;
    color: rgba(255,255,255,0.22);
    font-variant-numeric: tabular-nums;
  }

  /* Subsystems */
  .sm-loader-subsystems {
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: smFadeUp 0.7s 0.25s cubic-bezier(0.4,0,0.2,1) both;
  }
  .sm-loader-sys-row {
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.5s ease;
  }
  .sm-loader-sys-icon {
    font-size: 9px;
    color: #69f0ae;
    width: 10px;
    text-align: center;
  }
  .sm-loader-sys-label {
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.32);
  }

  /* Stamp */
  .sm-loader-stamp {
    position: absolute;
    bottom: 20px;
    font-size: 9px;
    letter-spacing: 0.28em;
    color: rgba(255,255,255,0.1);
    text-transform: uppercase;
  }

  /* Keyframes */
  @keyframes smGridScroll {
    from { background-position: 0 0; }
    to   { background-position: 0 64px; }
  }
  @keyframes smScan {
    0%   { top: 0%;   opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes smShimmer {
    0%   { left: -50px; }
    100% { left: 110%; }
  }
  @keyframes smPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.25; transform: scale(0.65); }
  }
  @keyframes smFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;
