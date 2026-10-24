export interface SanitizedPositions {
  values: Float32Array;
  validVertices: Uint8Array;
}

export function sanitizePositionBuffer(
  positions: ArrayLike<number>
): SanitizedPositions {
  const vertexCount = Math.floor(positions.length / 3);
  const values = new Float32Array(vertexCount * 3);
  const validVertices = new Uint8Array(vertexCount);

  for (let vertex = 0; vertex < vertexCount; vertex += 1) {
    const offset = vertex * 3;
    const x = positions[offset];
    const y = positions[offset + 1];
    const z = positions[offset + 2];
    if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
      values[offset] = x;
      values[offset + 1] = y;
      values[offset + 2] = z;
      validVertices[vertex] = 1;
    }
  }

  return { values, validVertices };
}

export function filterValidPrimitives(
  indices: ArrayLike<number>,
  validVertices: Uint8Array,
  primitiveSize: number
): Uint32Array {
  const filtered: number[] = [];

  for (
    let offset = 0;
    offset + primitiveSize <= indices.length;
    offset += primitiveSize
  ) {
    let isValid = true;
    for (let item = 0; item < primitiveSize; item += 1) {
      const vertex = indices[offset + item];
      if (
        !Number.isInteger(vertex) ||
        vertex < 0 ||
        vertex >= validVertices.length ||
        validVertices[vertex] === 0
      ) {
        isValid = false;
        break;
      }
    }

    if (isValid) {
      for (let item = 0; item < primitiveSize; item += 1) {
        filtered.push(indices[offset + item]);
      }
    }
  }

  return Uint32Array.from(filtered);
}

export function encodeIdRanges(
  vertexCount: number,
  intervals: Uint32Array
): Float32Array {
  const ids = new Float32Array(vertexCount * 4);
  for (let offset = 0; offset < intervals.length; offset += 3) {
    const id = intervals[offset];
    const start = Math.min(vertexCount, intervals[offset + 1]);
    const end = Math.min(vertexCount, intervals[offset + 2]);
    for (let vertex = start; vertex < end; vertex += 1) {
      const target = vertex * 4;
      ids[target] = (id % 256) / 255;
      ids[target + 1] = (Math.trunc(id / 256) % 256) / 255;
      ids[target + 2] = (Math.trunc(id / 65536) % 256) / 255;
      ids[target + 3] = (Math.trunc(id / 16777216) % 256) / 255;
    }
  }
  return ids;
}
