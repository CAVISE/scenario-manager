export type CP = 'tl' | 'tr' | 'bl' | 'br';

export interface EditorErrorScreenProps {
  title: string | null;
  message?: string;
  code?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const css = `
.sm-err-root {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #060c10;
  font-family: "Courier New", Courier, monospace;
  overflow: hidden;
}

/* grid */
.sm-err-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255,82,82,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,82,82,0.04) 1px, transparent 1px);
  background-size: 48px 48px;
  pointer-events: none;
}

/* scan line */
.sm-err-scan {
  position: absolute;
  left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, rgba(255,82,82,0.18), transparent);
  animation: smErrScan 4s linear infinite;
  pointer-events: none;
}
@keyframes smErrScan {
  0%   { top: -2px; }
  100% { top: 100%; }
}

/* corners */
.sm-corner {
  position: absolute;
  width: 22px;
  height: 22px;
  border-color: rgba(255,82,82,0.45);
  border-style: solid;
}
.sm-corner-tl { top: 24px; left: 24px; border-width: 2px 0 0 2px; }
.sm-corner-tr { top: 24px; right: 24px; border-width: 2px 2px 0 0; }
.sm-corner-bl { bottom: 24px; left: 24px; border-width: 0 0 2px 2px; }
.sm-corner-br { bottom: 24px; right: 24px; border-width: 0 2px 2px 0; }

/* card */
.sm-err-card {
  position: relative;
  width: 420px;
  background: rgba(18,6,6,0.88);
  border: 1px solid rgba(255,82,82,0.22);
  border-radius: 4px;
  padding: 36px 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  backdrop-filter: blur(6px);
  box-shadow:
    0 0 0 1px rgba(255,82,82,0.06),
    0 24px 64px rgba(0,0,0,0.7),
    inset 0 1px 0 rgba(255,82,82,0.1);
  animation: smErrAppear 0.4s cubic-bezier(0.22,1,0.36,1) both;
}
@keyframes smErrAppear {
  from { transform: scale(0.97) translateY(6px); opacity: 0; }
  to   { transform: scale(1) translateY(0); opacity: 1; }
}

/* card corner accents */
.sm-err-card::before,
.sm-err-card::after {
  content: '';
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: rgba(255,82,82,0.55);
  border-style: solid;
}
.sm-err-card::before { top: -1px; left: -1px; border-width: 2px 0 0 2px; }
.sm-err-card::after  { bottom: -1px; right: -1px; border-width: 0 2px 2px 0; }

/* logo area */
.sm-err-logo-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}

.sm-err-title-block {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.sm-err-subtitle {
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(255,82,82,0.5);
  text-transform: uppercase;
}
.sm-err-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 1.5px;
  color: #ff5252;
  text-transform: uppercase;
}

/* divider */
.sm-err-divider {
  height: 1px;
  background: linear-gradient(90deg, rgba(255,82,82,0.25), transparent);
}

/* error message block */
.sm-err-msg-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sm-err-label {
  font-size: 9px;
  letter-spacing: 2.5px;
  color: rgba(255,82,82,0.45);
  text-transform: uppercase;
}
.sm-err-message {
  font-size: 13px;
  color: rgba(255,200,200,0.75);
  line-height: 1.55;
  word-break: break-word;
  min-height: 40px;
}

/* subsystems (failed list) */
.sm-err-subsystems {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sm-err-sys-row {
  display: flex;
  align-items: center;
  gap: 8px;
  transition: opacity 0.4s;
}
.sm-err-sys-icon {
  font-size: 11px;
  color: rgba(255,82,82,0.7);
  width: 14px;
  text-align: center;
  flex-shrink: 0;
}
.sm-err-sys-label {
  font-size: 11px;
  letter-spacing: 0.5px;
  color: rgba(255,160,160,0.55);
}

/* actions */
.sm-err-actions {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.sm-err-btn {
  flex: 1;
  height: 36px;
  border-radius: 3px;
  font-family: "Courier New", Courier, monospace;
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.sm-err-btn-retry {
  background: rgba(255,82,82,0.12);
  border: 1px solid rgba(255,82,82,0.4);
  color: #ff5252;
}
.sm-err-btn-retry:hover {
  background: rgba(255,82,82,0.22);
  border-color: rgba(255,82,82,0.7);
}
.sm-err-btn-dismiss {
  background: transparent;
  border: 1px solid rgba(255,82,82,0.18);
  color: rgba(255,160,160,0.45);
}
.sm-err-btn-dismiss:hover {
  background: rgba(255,82,82,0.06);
  color: rgba(255,160,160,0.7);
}

/* stamp */
.sm-err-stamp {
  position: absolute;
  bottom: 14px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 9px;
  letter-spacing: 3px;
  color: rgba(255,82,82,0.2);
  text-transform: uppercase;
  white-space: nowrap;
}

/* vignette */
.sm-err-root::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%);
  pointer-events: none;
}
`;