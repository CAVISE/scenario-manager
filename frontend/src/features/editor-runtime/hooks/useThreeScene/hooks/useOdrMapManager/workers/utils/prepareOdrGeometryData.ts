import {
  encodeIdRanges,
  filterValidPrimitives,
  sanitizePositionBuffer,
} from '@/shared/lib/geometryBufferUtils';
import type {
  PreparedOdrGeometry,
  PreparedOdrMesh,
} from '@editor/types/odrGeometryTypes';
import type {
  NumberMap,
  NumberVector,
  WorkerMesh,
  WorkerModule,
  WorkerOpenDriveMap,
} from '../../types/odrWorkerModuleTypes';

function readFloatVector(vector: NumberVector): Float32Array {
  const values = new Float32Array(vector.size());
  for (let index = 0; index < values.length; index += 1) {
    values[index] = vector.get(index);
  }
  vector.delete();
  return values;
}

function readIndexVector(vector: NumberVector): Uint32Array {
  const values = new Uint32Array(vector.size());
  for (let index = 0; index < values.length; index += 1) {
    values[index] = vector.get(index);
  }
  vector.delete();
  return values;
}

function readIntervals(
  entries: NumberMap,
  getInterval: (id: number) => [number, number]
): Uint32Array {
  const keys = entries.keys();
  const intervals = new Uint32Array(keys.size() * 3);
  for (let index = 0; index < keys.size(); index += 1) {
    const id = keys.get(index);
    const [start, end] = getInterval(id);
    const offset = index * 3;
    intervals[offset] = id;
    intervals[offset + 1] = start;
    intervals[offset + 2] = end;
  }
  keys.delete();
  return intervals;
}

function prepareMesh(
  mesh: WorkerMesh,
  outlineIndices: NumberVector,
  intervals: Uint32Array
): PreparedOdrMesh {
  const sanitizedPositions = sanitizePositionBuffer(
    readFloatVector(mesh.vertices)
  );
  const vertexCount = sanitizedPositions.values.length / 3;
  const colors = new Float32Array(vertexCount * 3);
  colors.fill(1);

  return {
    positions: sanitizedPositions.values,
    stCoordinates: readFloatVector(mesh.st_coordinates),
    colors,
    ids: encodeIdRanges(vertexCount, intervals),
    indices: filterValidPrimitives(
      readIndexVector(mesh.indices),
      sanitizedPositions.validVertices,
      3
    ),
    outlineIndices: filterValidPrimitives(
      readIndexVector(outlineIndices),
      sanitizedPositions.validVertices,
      2
    ),
    intervals,
  };
}

export function prepareOdrGeometryData(
  Module: WorkerModule,
  map: WorkerOpenDriveMap,
  resolution: number
): PreparedOdrGeometry {
  const refline = Module.get_refline_segments(map, resolution);
  const preparedRefline = sanitizePositionBuffer(
    readFloatVector(refline.vertices)
  );
  const roadNetwork = Module.get_road_network_mesh(map, resolution);

  try {
    const laneIntervals = readIntervals(
      roadNetwork.lanes_mesh.lane_start_indices,
      (id) => roadNetwork.lanes_mesh.get_idx_interval_lane(id)
    );
    const roadmarkIntervals = readIntervals(
      roadNetwork.roadmarks_mesh.roadmark_type_start_indices,
      (id) => roadNetwork.roadmarks_mesh.get_idx_interval_roadmark(id)
    );

    return {
      reflinePositions: preparedRefline.values,
      reflineIndices: filterValidPrimitives(
        readIndexVector(refline.indices),
        preparedRefline.validVertices,
        2
      ),
      lanes: prepareMesh(
        roadNetwork.lanes_mesh,
        roadNetwork.lanes_mesh.get_lane_outline_indices(),
        laneIntervals
      ),
      roadmarks: prepareMesh(
        roadNetwork.roadmarks_mesh,
        roadNetwork.roadmarks_mesh.get_roadmark_outline_indices(),
        roadmarkIntervals
      ),
    };
  } finally {
    roadNetwork.delete();
  }
}

export function getGeometryTransferables(
  geometry: PreparedOdrGeometry
): Transferable[] {
  const arrays = [
    geometry.reflinePositions,
    geometry.reflineIndices,
    ...Object.values(geometry.lanes),
    ...Object.values(geometry.roadmarks),
  ];
  return arrays.map((array) => array.buffer);
}
