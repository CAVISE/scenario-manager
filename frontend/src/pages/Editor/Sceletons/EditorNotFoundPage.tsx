import React, { useEffect, useState, useRef } from 'react';
import { CP, css, LOG_LINES } from './types/EditorNotFoundPageTypes';

const Corner: React.FC<{ pos: CP }> = ({ pos }) => (
  <div className={`nf-corner nf-corner-${pos}`} />
);

const HexLogo: React.FC = () => (
  <svg width="48" height="55" viewBox="0 0 56 64" fill="none">
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
      y="38"
      textAnchor="middle"
      fontSize="20"
      fontFamily='"Courier New", Courier, monospace'
      fontWeight="700"
      fill="rgba(255,72,72,0.8)"
      letterSpacing="0"
    >
      !
    </text>
    <circle
      cx="28"
      cy="32"
      r="25"
      stroke="rgba(255,72,72,0.15)"
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

export const NotFoundPage: React.FC = () => {
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRefs.current = LOG_LINES.map((line, i) =>
      setTimeout(() => setVisibleLogs((prev) => [...prev, i]), line.delay),
    );
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  return (
    <>
      <style>{css}</style>
      <div className="nf-root">
        <div className="nf-grid" />
        <div className="nf-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
          <Corner key={p} pos={p} />
        ))}

        <div className="nf-card">
          <div className="nf-logo-wrap">
            <HexLogo />
            <div className="nf-title-block">
              <span className="nf-subtitle">CAVISE / V2X SIM</span>
              <div className="nf-code">404</div>
            </div>
          </div>

          <div className="nf-divider" />

          <div className="nf-terminal">
            <div className="nf-terminal-header">
              <span className="nf-terminal-dot" />
              <span className="nf-terminal-label">System Diagnostic Log</span>
            </div>

            {LOG_LINES.map((line, i) =>
              visibleLogs.includes(i) ? (
                <div
                  key={i}
                  className="nf-log-row"
                  style={{ animationDelay: '0ms' }}
                >
                  <span className="nf-log-prefix">{line.prefix}</span>
                  <span className={`nf-log-text ${line.kind}`}>
                    {line.text}
                  </span>
                </div>
              ) : (
                <div key={i} className="nf-log-row" style={{ opacity: 1 }}>
                  <span
                    className="nf-log-prefix"
                    style={{ color: 'rgba(105,240,174,0.1)' }}
                  >
                    {'[SYS:·····]'}
                  </span>
                  <span
                    className="nf-skel"
                    style={{
                      height: '9px',
                      width: `${90 + ((i * 31) % 70)}px`,
                      marginTop: '1px',
                    }}
                  />
                </div>
              ),
            )}
          </div>

          <div className="nf-actions">
            <button
              className="nf-btn nf-btn-primary"
              onClick={() => window.history.back()}
            >
              ← Go Back
            </button>
            <button
              className="nf-btn nf-btn-secondary"
              onClick={() => (window.location.href = '/')}
            >
              Return Home
            </button>
          </div>
        </div>

        <span className="nf-stamp">CAVISE · SM · ROUTE_ERR · 0x404</span>
      </div>
    </>
  );
};

export default NotFoundPage;
