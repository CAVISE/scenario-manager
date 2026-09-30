import type { EntityKind } from '@/store/types/sceneEntityTypes';

export type SceneTypeName =
  'Car' | 'RSU' | 'Building' | 'Lidar' | 'Point' | 'Pedestrian';

export interface SceneTypeMeta {
  icon: string;
  color: string;
  label: string;
}

export interface NavigationNode {
  id: string;
  name: string;
  kind?: EntityKind;
  children?: NavigationNode[];
}

export interface SceneTreePanelProps {
  readOnly?: boolean;
}
