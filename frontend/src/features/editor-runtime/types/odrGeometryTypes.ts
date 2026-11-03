export interface PreparedOdrMesh {
  positions: Float32Array;
  stCoordinates: Float32Array;
  colors: Float32Array;
  ids: Float32Array;
  indices: Uint32Array;
  outlineIndices: Uint32Array;
  intervals: Uint32Array;
}

export interface PreparedOdrGeometry {
  reflinePositions: Float32Array;
  reflineIndices: Uint32Array;
  lanes: PreparedOdrMesh;
  roadmarks: PreparedOdrMesh;
}

export interface PrepareOdrGeometryRequest {
  xodr: string;
  resolution: number;
}

export type PrepareOdrGeometryResponse =
  | { type: 'success'; geometry: PreparedOdrGeometry }
  | { type: 'error'; message: string };
