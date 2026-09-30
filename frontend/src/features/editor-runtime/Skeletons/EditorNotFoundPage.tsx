import React, { useEffect, useState, useRef } from 'react';
import type { CornerProps } from './types/SkeletonTypes';
import { notFoundLogLines } from './constants/editorScreenConstants';
import { HexLogo } from '@/shared/ui/HexLogo';
import './styles/EditorNotFoundPage.scss';

export const Corner: React.FC<CornerProps> = ({ pos }) => (
  <div className={`nf-corner nf-corner-${pos}`} />
);

export const NotFoundPage: React.FC = () => {
  const [visibleLogs, setVisibleLogs] = useState<number[]>([]);
  const timerRefs = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timerRefs.current = notFoundLogLines.map((line, i) =>
      setTimeout(() => setVisibleLogs((prev) => [...prev, i]), line.delay)
    );
    return () => timerRefs.current.forEach(clearTimeout);
  }, []);

  return (
    <>
      <div className="nf-root">
        <div className="nf-grid" />
        <div className="nf-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
          <Corner key={p} pos={p} />
        ))}

        <div className="nf-card">
          <div className="nf-logo-wrap">
            <HexLogo variant="error" />
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

            {notFoundLogLines.map((line, i) =>
              visibleLogs.includes(i) ? (
                <div key={i} className="nf-log-row nf-log-row--visible">
                  <span className="nf-log-prefix">{line.prefix}</span>
                  <span className={`nf-log-text ${line.kind}`}>
                    {line.text}
                  </span>
                </div>
              ) : (
                <div key={i} className="nf-log-row nf-log-row--placeholder">
                  <span className="nf-log-prefix nf-log-prefix--placeholder">
                    {'[SYS:·····]'}
                  </span>
                  <span className={`nf-skel nf-skel--${i}`} />
                </div>
              )
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
