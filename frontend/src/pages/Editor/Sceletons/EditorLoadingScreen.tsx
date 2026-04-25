import React, { useEffect, useState } from 'react';
import { css, subsystems, CP } from './types/EditorLoadingScreenTypes';
import { useHooks } from '../context';
export const EditorLoadingScreen = () => {
  const { loadingProgress, loadingText } = useHooks();

  const [mounted, setMounted] = useState(loadingText !== null);
  const [opacity, setOpacity] = useState(loadingText !== null ? 1 : 0);
  useEffect(() => {
    if (loadingText !== null) {
      setMounted(true);
      requestAnimationFrame(() => setOpacity(1));
    } else {
      setOpacity(0);
      const t = setTimeout(() => setMounted(false), 2000);
      return () => clearTimeout(t);
    }
  }, [loadingText]);

  if (!mounted) return null;

  return (
    <>
      <style>{css}</style>
      <div
        className="sm-loader-root"
        style={{
          opacity,
          transition: 'opacity 0.65s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="sm-loader-grid" />

        <div className="sm-loader-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
          <Corner key={p} pos={p} />
        ))}

        <div className="sm-loader-card">
          <div className="sm-loader-logo-wrap">
            <HexLogo />
            <div className="sm-loader-title-block">
              <span className="sm-loader-subtitle">CAVISE / V2X SIM</span>
              <span className="sm-loader-title">ScenarioManager</span>
            </div>
          </div>

          <div className="sm-loader-divider" />

          <div className="sm-loader-progress-wrap">
            <div className="sm-loader-bar-track">
              <div
                className="sm-loader-bar-fill"
                style={{ width: `${loadingProgress}%` }}
              />
              <div className="sm-loader-bar-shimmer" />
            </div>
            <div className="sm-loader-status-row">
              <span className="sm-loader-status-text">
                <span className="sm-loader-dot" />
                {loadingText ?? 'Ready'}
              </span>
              <span className="sm-loader-pct">
                {Math.round(loadingProgress)}%
              </span>
            </div>
          </div>

          <div className="sm-loader-subsystems">
            {subsystems.map(({ label, threshold }, i) => (
              <div
                key={label}
                className="sm-loader-sys-row"
                style={{
                  opacity: loadingProgress >= threshold ? 1 : 0.22,
                  transitionDelay: `${i * 120}ms`,
                }}
              >
                <span className="sm-loader-sys-icon">
                  {loadingProgress >= threshold ? '✓' : '○'}
                </span>
                <span className="sm-loader-sys-label">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <span className="sm-loader-stamp">CAVISE · SM · BUILD 2025</span>
      </div>
    </>
  );
};

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

const Corner: React.FC<{ pos: CP }> = ({ pos }) => (
  <div className={`sm-corner sm-corner-${pos}`} />
);
