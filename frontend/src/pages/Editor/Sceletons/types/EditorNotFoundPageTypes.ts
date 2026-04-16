export type CP = 'tl' | 'tr' | 'bl' | 'br';

export const css = `
  .nf-root {
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

  .nf-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(105,240,174,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(105,240,174,0.035) 1px, transparent 1px);
    background-size: 64px 64px;
    animation: nfGridScroll 10s linear infinite;
    pointer-events: none;
  }

  .nf-scan {
    position: absolute;
    left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent 0%, rgba(105,240,174,0.55) 50%, transparent 100%);
    animation: nfScan 4s ease-in-out infinite;
    pointer-events: none;
  }

  .nf-corner { position: absolute; width: 20px; height: 20px; }
  .nf-corner-tl { top: 28px; left: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .nf-corner-tr { top: 28px; right: 28px;
    border-top: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }
  .nf-corner-bl { bottom: 28px; left: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-left: 1px solid rgba(105,240,174,0.3); }
  .nf-corner-br { bottom: 28px; right: 28px;
    border-bottom: 1px solid rgba(105,240,174,0.3);
    border-right: 1px solid rgba(105,240,174,0.3); }

  .nf-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
    animation: nfFadeUp 0.7s cubic-bezier(0.4,0,0.2,1) both;
  }

  .nf-logo-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
  }
  .nf-title-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  .nf-subtitle {
    font-size: 10px;
    letter-spacing: 0.42em;
    color: rgba(105,240,174,0.45);
    text-transform: uppercase;
  }
  .nf-code {
    font-size: 72px;
    font-weight: 700;
    letter-spacing: 0.08em;
    color: #fff;
    line-height: 1;
    position: relative;
    text-shadow:
      0 0 18px rgba(105,240,174,0.25),
      0 0 42px rgba(105,240,174,0.10);
    animation: nfGlitch 6s steps(1) infinite;
  }
  .nf-code::before,
  .nf-code::after {
    content: '404';
    position: absolute;
    inset: 0;
    text-align: center;
  }
  .nf-code::before {
    color: rgba(105,240,174,0.55);
    clip-path: polygon(0 20%, 100% 20%, 100% 40%, 0 40%);
    animation: nfGlitchA 6s steps(1) infinite;
  }
  .nf-code::after {
    color: rgba(64,196,255,0.45);
    clip-path: polygon(0 60%, 100% 60%, 100% 80%, 0 80%);
    animation: nfGlitchB 6s steps(1) infinite;
  }

  .nf-divider {
    width: 280px;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(105,240,174,0.2), transparent);
  }

  .nf-terminal {
    width: 340px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: nfFadeUp 0.7s 0.2s cubic-bezier(0.4,0,0.2,1) both;
  }
  .nf-terminal-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(105,240,174,0.1);
  }
  .nf-terminal-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: #69f0ae;
    animation: nfPulse 1.3s ease-in-out infinite;
    flex-shrink: 0;
  }
  .nf-terminal-label {
    font-size: 9px;
    letter-spacing: 0.3em;
    color: rgba(105,240,174,0.5);
    text-transform: uppercase;
  }
  .nf-log-row {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 9px;
    letter-spacing: 0.08em;
    opacity: 0;
    animation: nfFadeIn 0.3s ease forwards;
  }
  .nf-log-prefix {
    color: rgba(105,240,174,0.35);
    flex-shrink: 0;
    min-width: 66px;
  }
  .nf-log-text { color: rgba(255,255,255,0.3); }
  .nf-log-text.error { color: rgba(255,72,72,0.65); }
  .nf-log-text.warn  { color: rgba(255,196,0,0.55); }
  .nf-log-text.ok    { color: rgba(105,240,174,0.7); }

  .nf-actions {
    display: flex;
    gap: 12px;
    animation: nfFadeUp 0.7s 0.45s cubic-bezier(0.4,0,0.2,1) both;
  }
  .nf-btn {
    font-family: "Courier New", Courier, monospace;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    padding: 8px 18px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }
  .nf-btn-primary {
    background: rgba(105,240,174,0.1);
    color: #69f0ae;
    outline: 1px solid rgba(105,240,174,0.3);
  }
  .nf-btn-primary:hover {
    background: rgba(105,240,174,0.18);
    outline-color: rgba(105,240,174,0.7);
    text-shadow: 0 0 8px rgba(105,240,174,0.6);
  }
  .nf-btn-secondary {
    background: transparent;
    color: rgba(255,255,255,0.2);
    outline: 1px solid rgba(255,255,255,0.08);
  }
  .nf-btn-secondary:hover {
    color: rgba(255,255,255,0.5);
    outline-color: rgba(255,255,255,0.22);
  }

  .nf-stamp {
    position: absolute;
    bottom: 20px;
    font-size: 9px;
    letter-spacing: 0.28em;
    color: rgba(255,255,255,0.1);
    text-transform: uppercase;
  }

  .nf-skel {
    position: relative;
    overflow: hidden;
    background: rgba(255,255,255,0.05);
    border-radius: 1px;
  }
  .nf-skel::after {
    content: '';
    position: absolute;
    inset-block: 0;
    width: 60%;
    background: linear-gradient(90deg, transparent, rgba(105,240,174,0.08), transparent);
    animation: nfSkelShimmer 2s ease-in-out infinite;
  }

  @keyframes nfGridScroll {
    from { background-position: 0 0; }
    to   { background-position: 0 64px; }
  }
  @keyframes nfScan {
    0%   { top: 0%;   opacity: 0; }
    5%   { opacity: 1; }
    95%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @keyframes nfFadeUp {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes nfFadeIn {
    to { opacity: 1; }
  }
  @keyframes nfPulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.25; transform: scale(0.65); }
  }
  @keyframes nfSkelShimmer {
    0%   { left: -60%; }
    100% { left: 110%; }
  }
  @keyframes nfGlitch {
    0%, 90%, 100% { transform: translate(0); }
    91%  { transform: translate(-2px, 1px); }
    92%  { transform: translate(2px, -1px); }
    93%  { transform: translate(0); }
  }
  @keyframes nfGlitchA {
    0%, 89%, 100% { transform: translate(0); opacity: 0; }
    90%  { transform: translate(-3px, 0); opacity: 1; }
    91%  { transform: translate(3px, 0);  opacity: 1; }
    92%  { transform: translate(0);       opacity: 0; }
  }
  @keyframes nfGlitchB {
    0%, 89%, 100% { transform: translate(0); opacity: 0; }
    90%  { transform: translate(3px, 0);  opacity: 1; }
    91%  { transform: translate(-3px, 0); opacity: 1; }
    92%  { transform: translate(0);       opacity: 0; }
  }
`;

export const LOG_LINES: { prefix: string; text: string; kind: 'error' | 'warn' | 'ok' | ''; delay: number }[] = [
  { prefix: '[SYS:ROUTER]',  text: 'Resolving route path…',          kind: '',      delay: 100  },
  { prefix: '[SYS:ROUTER]',  text: 'ERROR — no handler registered',  kind: 'error', delay: 350  },
  { prefix: '[SYS:CACHE]',   text: 'Cache miss on requested URI',     kind: 'warn',  delay: 600  },
  { prefix: '[SYS:KERNEL]',  text: 'Dispatching signal SIGNOTFOUND',  kind: '',      delay: 850  },
  { prefix: '[SYS:RENDER]',  text: '404 handler mounted successfully', kind: 'ok',   delay: 1100 },
];