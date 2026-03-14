export interface StdVec<T = number> {
  size(): number;
  get(idx: number): T;
  delete(): void;
}

export interface StdMap<K = number, V = number> {
  keys(): StdVec<K>;
  get(key: K): V;
  delete(): void;
}

export interface OdrMeshUnion {
  vertices: StdVec<number>;
  st_coordinates: StdVec<number>;
  indices: StdVec<number>;
}
export interface OdrLanesMesh extends OdrMeshUnion {
  lane_start_indices: StdMap<number, number>;
  get_idx_interval_lane(id: number): [number, number];
  get_lane_outline_indices(): StdVec<number>;
  get_road_id(id: number): number;
  get_lanesec_s0(id: number): number;
  get_lane_id(id: number): number;
  delete(): void;
}

export interface OdrRoadmarksMesh extends OdrMeshUnion {
  roadmark_type_start_indices: StdMap<number, number>;
  get_idx_interval_roadmark(id: number): [number, number];
  get_roadmark_outline_indices(): StdVec<number>;
  delete(): void;
}