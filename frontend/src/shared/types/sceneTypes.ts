export type Vec3 = { x: number; y: number; z: number };

export interface SelectedObject {
  type:
    | 'rsu'
    | 'point'
    | 'building'
    | 'route-point'
    | 'lidar'
    | 'car'
    | 'pedestrian';
  id?: string;
  position?: Vec3;
}
