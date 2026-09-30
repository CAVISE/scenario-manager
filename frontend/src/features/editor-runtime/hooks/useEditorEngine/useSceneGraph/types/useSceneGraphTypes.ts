export interface SceneNode {
  id: string;
  name: string;
  children?: SceneNode[];
}

export type KnownUserDataType =
  'car' | 'rsu' | 'building' | 'lidar' | 'pedestrian';

export interface KnownUserData {
  type?: string;
  id?: string;
  carId?: string;
}
