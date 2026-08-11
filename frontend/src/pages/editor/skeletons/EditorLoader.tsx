import React from 'react';
import { css } from './EditorLoadingScreen.types';

export const AppLoader = () => {
  return (
    <>
      <style>{css}</style>

      <div className="sm-loader-root">
        <div className="sm-loader-grid" />
        <div className="sm-loader-scan" />

        <div className="sm-loader-card">
          <HexLogo />

          <div className="sm-loader-bar-track">
            <div className="sm-loader-bar-scroll" />
          </div>
        </div>
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
