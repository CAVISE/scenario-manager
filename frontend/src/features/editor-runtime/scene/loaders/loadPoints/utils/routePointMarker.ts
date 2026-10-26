import * as THREE from 'three';
import { POINT_RADIUS, POINT_SEGMENTS } from '../constants/loadPointsConstants';
import type { Point } from '@/entities/vehicle';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { isEditorVisualVisible } from '@editor/lib/visualPreferences';

const MARKER_COLOR = 0x431407;
const RING_COLOR = 0xf97316;
const CENTER_COLOR = 0xffedd5;

export function createRoutePointMarker(
  point: Point,
  index: number
): THREE.Mesh {
  const markerGeometry = new THREE.CircleGeometry(POINT_RADIUS, POINT_SEGMENTS);
  markerGeometry.translate(0, 0, 0.02);
  const marker = new THREE.Mesh(
    markerGeometry,
    new THREE.MeshBasicMaterial({
      color: MARKER_COLOR,
      opacity: 1,
      depthWrite: false,
    })
  );
  marker.name = 'route-point';
  marker.visible = isEditorVisualVisible(
    useWorkspacePreferences.getState(),
    'routes'
  );
  marker.renderOrder = 100;
  marker.userData = {
    type: 'route-point',
    id: point.id,
    carId: point.carId,
  };
  marker.position.set(point.x, point.y, point.z);

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(
      POINT_RADIUS * 1.06,
      POINT_RADIUS * 1.3,
      POINT_SEGMENTS
    ),
    new THREE.MeshBasicMaterial({
      color: RING_COLOR,
      opacity: 1,
      depthWrite: false,
    })
  );
  ring.position.z = 0.01;
  ring.renderOrder = 101;
  marker.add(ring);

  const center = new THREE.Mesh(
    new THREE.CircleGeometry(POINT_RADIUS * 0.56, POINT_SEGMENTS),
    new THREE.MeshBasicMaterial({
      color: CENTER_COLOR,
      depthWrite: false,
    })
  );
  center.position.z = 0.02;
  center.renderOrder = 102;
  marker.add(center);

  marker.add(createWaypointLabel(index));
  return marker;
}

function createWaypointLabel(index: number): THREE.Sprite {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return new THREE.Sprite();

  context.font = '700 78px Inter, Segoe UI, sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.lineWidth = 8;
  context.strokeStyle = '#ffffff';
  context.strokeText(String(index + 1), 48, 48);
  context.fillStyle = '#082f49';
  context.fillText(String(index + 1), 48, 48);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const label = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
    })
  );
  label.name = 'route-point-label';
  label.scale.set(2.45, 2.45, 1);
  label.position.z = 0.08;
  label.renderOrder = 103;
  return label;
}

export function disposeRoutePointMarker(marker: THREE.Object3D) {
  marker.traverse((object) => {
    const mesh = object as THREE.Mesh;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];
    materials.forEach((material) => {
      const textureMaterial = material as THREE.Material & {
        map?: THREE.Texture;
      };
      textureMaterial.map?.dispose();
      material.dispose();
    });
  });
}
