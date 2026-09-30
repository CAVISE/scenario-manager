import React, { useEffect, useState } from 'react';
import type { CornerProps } from './types/SkeletonTypes';
import { loadingSubsystems } from './constants/editorScreenConstants';
import { useHooks } from '../context';
import { HexLogo } from '@/shared/ui/HexLogo';
import './styles/EditorLoadingScreen.scss';
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
      <div
        className={`sm-loader-root${opacity === 1 ? ' sm-loader-root--visible' : ''}`}
      >
        <div className="sm-loader-grid" />

        <div className="sm-loader-scan" />

        {(['tl', 'tr', 'bl', 'br'] as const).map((p) => (
          <Corner key={p} pos={p} />
        ))}

        <div className="sm-loader-card">
          <div className="sm-loader-logo-wrap">
            <HexLogo withWordmark />
          </div>

          <div className="sm-loader-divider" />

          <div className="sm-loader-progress-wrap">
            <div className="sm-loader-bar-track">
              <progress
                className="sm-loader-bar-fill"
                value={loadingProgress}
                max={100}
                aria-label="Loading progress"
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
            {loadingSubsystems.map(({ label, threshold }, i) => (
              <div
                key={label}
                className={`sm-loader-sys-row sm-loader-sys-row--${i}${loadingProgress >= threshold ? ' sm-loader-sys-row--ready' : ''}`}
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

const Corner: React.FC<CornerProps> = ({ pos }) => (
  <div className={`sm-corner sm-corner-${pos}`} />
);
