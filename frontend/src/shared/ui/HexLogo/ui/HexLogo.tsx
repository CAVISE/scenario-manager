import type { HexLogoProps } from '../types/HexLogoTypes';
import '../styles/HexLogo.scss';

export function HexLogo({
  variant = 'default',
  withWordmark = false,
}: HexLogoProps) {
  const isError = variant === 'error';
  const showWordmark = withWordmark && !isError;

  return (
    <svg
      className={`cavise-logo${isError ? ' cavise-logo--error' : ''}`}
      width={showWordmark ? '300' : isError ? '48' : '60'}
      height={showWordmark ? '78' : isError ? '48' : '60'}
      viewBox={showWordmark ? '0 0 300 78' : '0 0 72 72'}
      role="img"
      aria-label={isError ? 'CAVISE error' : 'CAVISE'}
    >
      <g className="cavise-logo__mark">
        <rect x="4" y="4" width="28" height="28" rx="4" />
        <rect x="40" y="4" width="28" height="28" rx="4" />
        <rect x="4" y="40" width="28" height="28" rx="4" />
        <rect x="40" y="40" width="28" height="28" rx="4" />
        <path d="M32 18h8M18 32v8M54 32v8M32 54h8" />
      </g>

      {isError ? (
        <text x="36" y="47" textAnchor="middle" className="cavise-logo__error">
          !
        </text>
      ) : null}

      {showWordmark ? (
        <>
          <text x="84" y="42" className="cavise-logo__wordmark">
            CAVISE
          </text>
          <text x="85" y="62" className="cavise-logo__tagline">
            Connected &amp; Automated Vehicle Simulation
          </text>
        </>
      ) : null}
    </svg>
  );
}
