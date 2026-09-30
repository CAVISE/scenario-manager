import type { EntityKind } from '@/store/types/sceneEntityTypes';
import type {
  SceneTypeMeta,
  SceneTypeName,
} from '../types/SceneTreePanelTypes';

export const ENTITY_TYPE_KEYS: Record<EntityKind, SceneTypeName> = {
  car: 'Car',
  rsu: 'RSU',
  building: 'Building',
  pedestrian: 'Pedestrian',
  point: 'Point',
  lidar: 'Lidar',
};

export const TYPE_META: Record<SceneTypeName, SceneTypeMeta> = {
  Car: { icon: '🚗', color: '#2563eb', label: 'CAR' },
  RSU: { icon: '📡', color: '#d97706', label: 'RSU' },
  Building: { icon: '🏢', color: '#7c3aed', label: 'BLD' },
  Lidar: { icon: '⬡', color: '#059669', label: 'LDR' },
  Point: { icon: '◎', color: '#db2777', label: 'WPT' },
  Pedestrian: { icon: '🚶', color: '#0920f0', label: 'HMN' },
};

export const DEFAULT_TYPE_META: SceneTypeMeta = {
  icon: '◇',
  color: '#6b7280',
  label: 'OBJ',
};
