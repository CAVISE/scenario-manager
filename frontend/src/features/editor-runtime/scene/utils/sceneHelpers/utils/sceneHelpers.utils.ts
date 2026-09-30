import { OdrMeshUnion } from '../types/sceneHelpersTypes';
import * as THREE from 'three';
import { getStdVecEntries } from '../ui/sceneHelpers';
export const ZOOM_MULTIPLIER = 1.5;
export const RADIANS_CONVERSION = Math.PI / 180.0;
export function get_geometry(odrMeshUnion: OdrMeshUnion): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();

  const positions = getStdVecEntries(odrMeshUnion.vertices, true);
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(positions.flat(), 3)
  );

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
  geometry.setIndex(indices);

  geometry.computeVertexNormals();
  return geometry;
}
