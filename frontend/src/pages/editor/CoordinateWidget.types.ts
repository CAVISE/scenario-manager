import * as THREE from 'three';
export interface CoordinatesWidgetProps {
  getCameraRef: () => THREE.PerspectiveCamera | undefined;
  getRoadMesh: () => THREE.Mesh | null;
}

export const GROUND_PLANE = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
export const CoordinatesWidgetDeactiveStyles = {
  position: 'fixed',
  top: '4em',
  right: '310px',
  zIndex: 1000,
  background: 'rgba(0,0,0,0.55)',
  color: '#888',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  pointerEvents: 'none',
  backdropFilter: 'blur(4px)',
  border: `1px solid ${'rgba(255,255,255,0.05)'}`,
  whiteSpace: 'nowrap',
  transition: 'color 0.2s, border-color 0.2s',
} as const;
export const CoordinateWidgetActiveStyles = {
  position: 'fixed',
  top: '4em',
  right: '310px',
  zIndex: 1000,
  background: 'rgba(0,0,0,0.55)',
  color: '#e0e0e0',
  fontFamily: 'monospace',
  fontSize: '12px',
  padding: '4px 10px',
  borderRadius: '6px',
  pointerEvents: 'none',
  backdropFilter: 'blur(4px)',
  border: `1px solid ${'rgba(255,255,255,0.15)'}`,
  whiteSpace: 'nowrap',
  transition: 'color 0.2s, border-color 0.2s',
} as const;
