export interface NumberVector {
  size(): number;
  get(index: number): number;
  delete(): void;
}

export interface NumberMap {
  keys(): NumberVector;
}

export interface WorkerMesh {
  vertices: NumberVector;
  st_coordinates: NumberVector;
  indices: NumberVector;
}

export interface WorkerLaneMesh extends WorkerMesh {
  lane_start_indices: NumberMap;
  get_idx_interval_lane(id: number): [number, number];
  get_lane_outline_indices(): NumberVector;
}

export interface WorkerRoadmarkMesh extends WorkerMesh {
  roadmark_type_start_indices: NumberMap;
  get_idx_interval_roadmark(id: number): [number, number];
  get_roadmark_outline_indices(): NumberVector;
}

export interface WorkerOpenDriveMap {
  delete(): void;
}

export interface WorkerModule {
  FS_unlink(path: string): void;
  FS_createDataFile(
    parent: string,
    name: string,
    data: string,
    canRead: boolean,
    canWrite: boolean
  ): void;
  OpenDriveMap: new (
    path: string,
    options: Record<string, boolean>
  ) => WorkerOpenDriveMap;
  get_refline_segments(
    map: WorkerOpenDriveMap,
    resolution: number
  ): { vertices: NumberVector; indices: NumberVector };
  get_road_network_mesh(
    map: WorkerOpenDriveMap,
    resolution: number
  ): {
    lanes_mesh: WorkerLaneMesh;
    roadmarks_mesh: WorkerRoadmarkMesh;
    delete(): void;
  };
}
