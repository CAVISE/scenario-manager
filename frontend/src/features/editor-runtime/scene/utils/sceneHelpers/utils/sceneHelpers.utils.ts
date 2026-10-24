import { OdrMeshUnion } from '../types/sceneHelpersTypes';
import * as THREE from 'three';
import { getStdVecEntries } from '../ui/sceneHelpers';
import {
  filterValidPrimitives,
  sanitizePositionBuffer,
} from '@/shared/lib/geometryBufferUtils';
import type { SanitizedPositions } from '@/shared/lib/geometryBufferUtils';

export type { SanitizedPositions } from '@/shared/lib/geometryBufferUtils';
export const ZOOM_MULTIPLIER = 1.5;
export const RADIANS_CONVERSION = Math.PI / 180.0;

/**
 * ModuleOpenDrive may return non-finite coordinates for malformed road
 * segments. Three.js cannot calculate bounds for such a buffer and then tries
 * again every frame. Preserve vertex numbering (used by lane IDs), replace
 * invalid values with a harmless origin and remove only primitives that use
 * those vertices.
 */
export function sanitizePositions(positions: number[]): SanitizedPositions {
  // Emscripten vectors currently contain coordinate triples at runtime even
  // though their TypeScript facade is numeric. Preserve support for both the
  // nested and already-flat representations.
  const flatPositions = positions.flat();
  return sanitizePositionBuffer(flatPositions);
}

export function filterInvalidPrimitives(
  indices: number[],
  validVertices: Uint8Array,
  primitiveSize: number
): number[] {
  return Array.from(
    filterValidPrimitives(indices, validVertices, primitiveSize)
  );
}

export function get_geometry(
  odrMeshUnion: OdrMeshUnion,
  options: { withVertexNormals?: boolean } = {}
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const positions = getStdVecEntries(odrMeshUnion.vertices, true);
  const sanitizedPositions = sanitizePositions(positions);
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(sanitizedPositions.values, 3)
  );
  geometry.userData.validVertices = sanitizedPositions.validVertices;

  const uvCoords = getStdVecEntries(odrMeshUnion.st_coordinates, true);
  geometry.setAttribute(
    'st',
    new THREE.Float32BufferAttribute(uvCoords.flat(), 2)
  );

  const vertexCount = geometry.attributes.position.count;
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(new Float32Array(vertexCount * 3), 3)
  );

  geometry.setAttribute(
    'id',
    new THREE.Float32BufferAttribute(new Float32Array(vertexCount * 4), 4)
  );

  const indices = getStdVecEntries(odrMeshUnion.indices, true);
  geometry.setIndex(
    filterInvalidPrimitives(indices, sanitizedPositions.validVertices, 3)
  );

  if (options.withVertexNormals !== false) geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}
