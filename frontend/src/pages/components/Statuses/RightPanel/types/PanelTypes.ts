import type * as THREE from 'three';
import type { TransformControls } from 'three-stdlib';
import type { Vec3 } from "../../../../Editor/types/editorTypes";
export const numInputSlot = {
  input: {
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    step: 'any',
  },
};

export type SceneNode = { id: string; name: string; children?: SceneNode[] };

export type SelectedObject = {
  type: 'car' | 'rsu' | 'point' | 'building' | 'lidar' | 'circle';
  id?: string;
  position?: Vec3;
} | null;

export type RightPanelProps = {
  sceneGraph:           SceneNode | null;
  onDetach:             () => void;
  onDeleteCar:          () => void;
  onDeleteCube:         () => void;
  selectedObject:       SelectedObject ;
  onDeleteSelected:     () => void;
  sceneRef:             React.MutableRefObject<THREE.Scene | undefined>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  onSelectObject:       (obj: SelectedObject) => void;
  pointsArrRef: React.MutableRefObject<THREE.Mesh[]>;
  carMeshesRef: React.MutableRefObject<THREE.Mesh[]>;
};
export const css = `
.rp-root {
  position: fixed;
  border-radius: 8px 0 0 8px;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #f8f7f4;
  border-left: 1px solid #e8e5df;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  z-index: 100;
  box-shadow: -4px 0 24px rgba(0,0,0,0.06);
  overflow: hidden;
  transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
}
.rp-root.collapsed {
  transform: translateX(282px);
}

.rp-toggle {
  position: fixed;
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  z-index: 101;
  width: 20px;
  height: 48px;
  background: #fff;
  border: 1px solid #e8e5df;
  border-right: none;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 8px rgba(0,0,0,0.06);
  transition: background 0.15s, right 0.3s cubic-bezier(0.4,0,0.2,1);
  padding: 0;
}
.rp-toggle:hover {
  background: #f2f0ec;
}
.rp-toggle.open {
  right: 280px;
}
.rp-toggle-arrow {
  font-size: 10px;
  color: #aaa;
  line-height: 1;
  transition: transform 0.3s;
  user-select: none;
}
.rp-toggle.open .rp-toggle-arrow {
  transform: rotate(180deg);
}

.rp-corner {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #2563eb;
  border-style: solid;
  opacity: 0.4;
  z-index: 1;
}
.rp-corner-tl { top: 4px;    left: 4px;    border-width: 3px 0 0 3px; }
.rp-corner-tr { top: 4px;    right: 4px;   border-width: 3px 3px 0 0; }
.rp-corner-bl { bottom: 4px; left: 4px;    border-width: 0 0 3px 3px; }
.rp-corner-br { bottom: 4px; right: 4px;   border-width: 0 3px 3px 0; }

.rp-header {
  padding: 16px 20px 13px;
  border-bottom: 1px solid #eeebe5;
  flex-shrink: 0;
  background: #fff;
}
.rp-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rp-title {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
}
.rp-badge {
  font-size: 9px;
  font-weight: 500;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #fff;
  background: #2563eb;
  padding: 2px 7px;
  border-radius: 10px;
}
.rp-subtitle {
  font-size: 11px;
  color: #9e9b94;
  margin-top: 3px;
}

.rp-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.rp-body::-webkit-scrollbar { display: none; }

.rp-section { border-bottom: 1px solid #eeebe5; }

.rp-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 11px 20px;
  cursor: pointer;
  user-select: none;
  transition: background 0.12s;
}
.rp-section-header:hover { background: #f2f0ec; }

.rp-section-label {
  font-size: 10px;
  font-weight: 600;
  color: #888;
  letter-spacing: 0.8px;
  text-transform: uppercase;
}
.rp-section-chevron {
  font-size: 9px;
  color: #ccc;
  transition: transform 0.2s;
  line-height: 1;
}
.rp-section-chevron.open { transform: rotate(180deg); }

.rp-section-content {
  padding: 4px 20px 14px;
  animation: rpFadeIn 0.15s ease;
}
@keyframes rpFadeIn {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.rp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 16px 0;
}
.rp-empty-icon {
  width: 28px;
  height: 28px;
  border: 1.5px dashed #ddd;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #ccc;
}
.rp-empty-text { font-size: 11px; color: #bbb; }

.rp-footer {
  padding: 9px 20px;
  font-size: 10px;
  color: #ccc;
  border-top: 1px solid #eeebe5;
  background: #fff;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rp-footer-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 4px rgba(34,197,94,0.5);
}
`;

export interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}