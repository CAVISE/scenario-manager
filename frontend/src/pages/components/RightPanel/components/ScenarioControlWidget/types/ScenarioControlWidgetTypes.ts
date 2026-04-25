import {
  Lidar,
  Point,
} from '../../../../../../../store/types/useEditorStoreTypes';
export interface CarPath {
  x: number;
  y: number;
  z: number;
  model?: string;
  color?: number;
  scale?: number;
  rotation?: number;
  selected?: boolean;
  speed?: number;
  points?: Pick<Point, 'x' | 'y' | 'z'>[];
  lidars?: Omit<Lidar, 'id' | 'carId'>[];
}

export interface RSUPath {
  x: number;
  y: number;
  z: number;
  tx_power?: number;
  frequency?: number;
  range?: number;
  protocol?: string;
  script?: string | null;
}

export interface BuildingPath {
  id?: string;
  x: number;
  y: number;
  z: number;
  height?: number;
  material?: string;
  scale?: number;
  rotation?: number;
}

export interface PedestrianPath {
  id?: string;
  x: number;
  y: number;
  z: number;
  speed?: number;
  cross_factor?: number;
  is_invincible?: boolean;
  tx_power?: number;
  frequency?: number;
  protocol?: string;
  beacon_interval?: number;
}

export interface ScenarioGroup<T> {
  vehicle: string;
  path: T[];
}
export const textAreaStyles = `{
            boxSizing: 'border-box',
            width: '100%',
            minHeight: '80px',
            resize: 'vertical',
            maxWidth: '100%',

            background: 'rgba(105,240,174,0.03)',
            border: '1px solid rgba(105,240,174,0.15)',
            outline: 'none',
            color: 'rgba(30, 0, 255, 0.75)',
            fontFamily: '"Courier New", Courier, monospace',
            fontSize: '10px',
            letterSpacing: '0.06em',
            lineHeight: '1.6',
            padding: '10px 12px',

            transition: 'border-color 0.2s ease, background 0.2s ease',
          }}
          onFocus={e => {
            e.target.style.borderColor = 'rgba(105,240,174,0.45)';
            e.target.style.background  = 'rgba(105,240,174,0.06)';
          }}
          onBlur={e => {
            e.target.style.borderColor = 'rgba(105,240,174,0.15)';
            e.target.style.background  = 'rgba(105,240,174,0.03)';
}`;
