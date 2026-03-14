import { TransformControls } from "three-stdlib";
import { SceneNode, SelectedObject } from "../../types/PanelTypes";
import * as THREE from 'three'
export interface SceneTreePanelProps {
  sceneGraph:           SceneNode | null;
  onDetach:             () => void;
  sceneRef:             React.MutableRefObject<THREE.Scene | undefined>;
  transformControlsRef: React.MutableRefObject<TransformControls | null>;
  onSelectObject:       (obj: SelectedObject) => void;
  pointsArrRef:         React.MutableRefObject<THREE.Mesh[]>;
  carMeshesRef:         React.MutableRefObject<THREE.Mesh[]>;
}

export const TYPE_META: Record<string, { icon: string; color: string; label: string }> = {
  Car:      { icon: '🚗', color: '#2563eb', label: 'CAR'  },
  RSU:      { icon: '📡', color: '#d97706', label: 'RSU'  },
  Building: { icon: '🏢', color: '#7c3aed', label: 'BLD'  },
  Lidar:    { icon: '⬡',  color: '#059669', label: 'LDR'  },
  Point:    { icon: '◎',  color: '#db2777', label: 'WPT'  },
};
export const css = `
  .stp-root {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    background: #f3f4f6;
    border-radius: 6px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
  }
  .stp-header {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }
  .stp-header-label {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    color: #9ca3af;
  }
  .stp-header-count {
    margin-left: auto;
    font-size: 10px;
    color: #d1d5db;
    font-weight: 500;
  }
  .stp-tree {
    padding: 4px 0 6px;
  }
  .stp-empty {
    display: flex; flex-direction: column; align-items: center;
    padding: 24px 0; gap: 5px;
  }
  .stp-empty-icon { font-size: 18px; opacity: 0.25; }
  .stp-empty-text { font-size: 11px; color: #d1d5db; }

  .stp-node {
    display: flex;
    align-items: center;
    height: 28px;
    width: 100%;
    gap: 0;
  }
  .stp-node-left {
    display: flex; align-items: center; gap: 5px;
    flex: 1; min-width: 0;
  }
  .stp-node-dot {
    width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
  }
  .stp-node-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; }
  .stp-node-name {
    font-size: 12px;
    color: #374151;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 400;
  }
  .stp-node-name.selected {
    color: #2563eb;
    font-weight: 500;
  }
  .stp-node-right {fP
    display: flex; align-items: center; gap: 5px;
    flex-shrink: 0; padding-left: 6px;
  }
  .stp-node-pos {
    font-size: 10px;
    color: #9ca3af;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    white-space: nowrap;
  }
  .stp-node-badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.8px;
    padding: 1px 5px;
    border-radius: 3px;
  }

  .MuiSimpleTreeView-root .MuiTreeItem-content {
    padding: 0 8px 0 6px !important;
    border-radius: 4px !important;
    min-height: 28px !important;
    transition: background 0.1s !important;
    margin: 0 4px !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-content:hover {
    background: #e9eaec !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-content.Mui-selected,
  .MuiSimpleTreeView-root .MuiTreeItem-content.Mui-selected.Mui-focused {
    background: #dbeafe !important;
    border-left: 3px solid #2563eb !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-content.Mui-focused {
    background: #f3f4f6 !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-group {
    margin-left: 0 !important;
    padding-left: 20px !important;
    border-left: 2px solid #e5e7eb !important;
    margin-left: 16px !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-iconContainer svg {
    color: #9ca3af !important;
    font-size: 14px !important;
  }
  .MuiSimpleTreeView-root .MuiTreeItem-label {
    padding: 0 !important;
  }
`;
