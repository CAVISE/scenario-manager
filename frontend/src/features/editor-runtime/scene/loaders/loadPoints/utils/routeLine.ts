import * as THREE from 'three';
import type { Vec3 } from '@/shared/types/sceneTypes';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { isEditorVisualVisible } from '@editor/lib/visualPreferences';

const ROUTE_HEIGHT = 0.1;
const ROUTE_RADIUS = 0.14;

export function createRouteLine(start: Vec3, end: Vec3): THREE.Mesh {
  const line = new THREE.Mesh(
    createRouteGeometry(start, end),
    new THREE.MeshBasicMaterial({ color: 0xf97316 })
  );
  line.name = 'route-connection';
  setRouteEndpoints(line, start, end);
  line.visible = isEditorVisualVisible(
    useWorkspacePreferences.getState(),
    'routes'
  );
  line.renderOrder = 90;
  return line;
}

export function updateRouteLine(
  line: THREE.Mesh,
  start: THREE.Vector3,
  end: THREE.Vector3
) {
  if (hasSameEndpoints(line, start, end)) return;
  const previousGeometry = line.geometry;
  line.geometry = createRouteGeometry(start, end);
  setRouteEndpoints(line, start, end);
  previousGeometry.dispose();
}

export function updateRouteLinesForWaypoint(
  waypointIndex: number,
  car: THREE.Mesh | undefined,
  waypoints: THREE.Mesh[],
  lines: THREE.Mesh[] | undefined
) {
  if (!car || !lines) return;

  const waypoint = waypoints[waypointIndex];
  if (!waypoint) return;

  const previous =
    waypointIndex === 0 ? car.position : waypoints[waypointIndex - 1]?.position;
  if (previous && lines[waypointIndex]) {
    updateRouteLine(lines[waypointIndex], previous, waypoint.position);
  }

  const next = waypoints[waypointIndex + 1];
  if (next && lines[waypointIndex + 1]) {
    updateRouteLine(lines[waypointIndex + 1], waypoint.position, next.position);
  }
}

export function updateRouteLinesForCar(
  car: THREE.Object3D | undefined,
  waypoints: THREE.Mesh[] | undefined,
  lines: THREE.Mesh[] | undefined
) {
  const firstWaypoint = waypoints?.[0];
  const firstLine = lines?.[0];
  if (car && firstWaypoint && firstLine)
    updateRouteLine(firstLine, car.position, firstWaypoint.position);
}

function hasSameEndpoints(
  line: THREE.Mesh,
  start: THREE.Vector3,
  end: THREE.Vector3
) {
  const previousStart = line.userData.routeStart as THREE.Vector3 | undefined;
  const previousEnd = line.userData.routeEnd as THREE.Vector3 | undefined;
  return previousStart?.equals(start) && previousEnd?.equals(end);
}

function setRouteEndpoints(line: THREE.Mesh, start: Vec3, end: Vec3) {
  line.userData.routeStart = new THREE.Vector3(start.x, start.y, start.z);
  line.userData.routeEnd = new THREE.Vector3(end.x, end.y, end.z);
}

function createRouteGeometry(start: Vec3, end: Vec3): THREE.TubeGeometry {
  const curve = new THREE.LineCurve3(
    new THREE.Vector3(start.x, start.y, start.z + ROUTE_HEIGHT),
    new THREE.Vector3(end.x, end.y, end.z + ROUTE_HEIGHT)
  );
  return new THREE.TubeGeometry(curve, 1, ROUTE_RADIUS, 8, false);
}
