import React, { useEffect, useState } from 'react';
import  {css, failedSubsystems} from "./types/EditorErrorScreenTypes"
import type { CP } from "./types/EditorErrorScreenTypes"
import { useEditorStore } from '../../../store/useEditorStore';
const HexErrorLogo: React.FC = () => (
  <svg width="56" height="64" viewBox="0 0 56 64" fill="none">
    <polygon
      points="28,3 53,17 53,47 28,61 3,47 3,17"
      stroke="rgba(255,82,82,0.35)"
      strokeWidth="1"
      fill="none"
    />
    <polygon
      points="28,11 45,21 45,43 28,53 11,43 11,21"
      stroke="rgba(255,82,82,0.12)"
      strokeWidth="1"
      fill="rgba(255,82,82,0.04)"
    />
    <line x1="21" y1="25" x2="35" y2="39" stroke="#ff5252" strokeWidth="2" strokeLinecap="round" />
    <line x1="35" y1="25" x2="21" y2="39" stroke="#ff5252" strokeWidth="2" strokeLinecap="round" />
    <circle cx="28" cy="32" r="25" stroke="rgba(255,82,82,0.12)" strokeWidth="0.5" strokeDasharray="3 9">
      <animateTransform
        attributeName="transform"
        type="rotate"
        from="0 28 32"
        to="360 28 32"
        dur="14s"
        repeatCount="indefinite"
      />
    </circle>
    <circle cx="28" cy="32" r="17" stroke="rgba(255,82,82,0.2)" strokeWidth="0.5">
      <animate attributeName="r" values="17;22;17" dur="3s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0;0.4" dur="3s" repeatCount="indefinite" />
    </circle>
  </svg>
);

const Corner: React.FC<{ pos: CP }> = ({ pos }) => (
  <div className={`sm-corner sm-corner-${pos}`} />
);

export const EditorErrorScreen: React.FC = ({

}) => {
  const error = useEditorStore(s=>s.error)
  const setError = useEditorStore(s=>s.setError)
  const message=error?.message
  const title= error ? 'Runtime Error' : null 
  const onRetry=() => { setError(null); window.location.reload(); }
  const onDismiss=() => setError(null)
  const [mounted, setMounted] = useState(title !== null);
  const [opacity, setOpacity] = useState(title !== null ? 1 : 0);
          
  useEffect(() => {
    if (title !== null) {
      setMounted(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const t = setTimeout(() => setMounted(false), 2000);
      return () => clearTimeout(t);
    }
  }, [title]);

  if (!mounted) return null;

  return (
    <>
      <style>{css}</style>
      <div
        className="sm-err-root"
        style={{ opacity, transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <div className="sm-err-grid" />
        <div className="sm-err-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map(p => <Corner key={p} pos={p} />)}

        <div className="sm-err-card">
          <div className="sm-err-logo-wrap">
            <HexErrorLogo />
            <div className="sm-err-title-block">
              <span className="sm-err-subtitle">CAVISE / V2X SIM</span>
              <span className="sm-err-title">{title ?? 'System Error'}</span>
            </div>
          </div>

          <div className="sm-err-divider" />

          <div className="sm-err-msg-block">
            <span className="sm-err-label">Error Details</span>
            <span className="sm-err-message">{message}</span>
          </div>

          <div className="sm-err-subsystems">
            {failedSubsystems.map(({ label, failed }) => (
              <div
                key={label}
                className="sm-err-sys-row"
                style={{ opacity: failed ? 1 : 0.3 }}
              >
                <span className="sm-err-sys-icon">{failed ? '✕' : '○'}</span>
                <span className="sm-err-sys-label">{label}</span>
              </div>
            ))}
          </div>

          
            <div className="sm-err-actions">
              {onRetry && (
                <button className="sm-err-btn sm-err-btn-retry" onClick={onRetry}>
                  ↺ Retry
                </button>
              )}
              {onDismiss && (
                <button className="sm-err-btn sm-err-btn-dismiss" onClick={onDismiss}>
                  Dismiss
                </button>
              )}
            </div>
        </div>

        <span className="sm-err-stamp">
          CAVISE · SM · BUILD 2025
        </span>
      </div>
    </>
  );
};
