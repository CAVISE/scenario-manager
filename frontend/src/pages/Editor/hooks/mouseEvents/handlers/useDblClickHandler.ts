import { useCallback, useRef } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useHooks, useEditorRefs } from '@editor/context';
import { useAppToast } from '@/components/AppToast';

import {
  InactivityModeTimeoutHandle,
  createInactivityModeTimeout,
} from '../utils/createInactivityModeTimeout';
import {
  Footprint2D,
  checkObjectOverlap,
} from '@editor/scene/utils/checkObjectOverlap';

const ADD_MODE_INACTIVITY_TIMEOUT_MS = 30_000;

function sampleFootprintGrid(fp: Footprint2D): { x: number; y: number }[] {
  const cos = Math.cos(fp.rotation);
  const sin = Math.sin(fp.rotation);
  const points: { x: number; y: number }[] = [];

  const divisionsX = Math.max(1, Math.ceil(2 * fp.halfExtentX));
  const divisionsY = Math.max(1, Math.ceil(2 * fp.halfExtentY));

  for (let i = 0; i <= divisionsX; i++) {
    for (let j = 0; j <= divisionsY; j++) {
      const localX = -fp.halfExtentX + (2 * fp.halfExtentX * i) / divisionsX;
      const localY = -fp.halfExtentY + (2 * fp.halfExtentY * j) / divisionsY;
      points.push({
        x: fp.centerX + localX * cos - localY * sin,
        y: fp.centerY + localX * sin + localY * cos,
      });
    }
  }

  return points;
}

let cachedRoadBox: THREE.Box3 | null = null;
let cachedRoadRef: THREE.Object3D | null = null;

function getRoadWorldBox(road: THREE.Object3D): THREE.Box3 {
  if (cachedRoadRef === road && cachedRoadBox) {
    return cachedRoadBox;
  }
  const box = new THREE.Box3().setFromObject(road);
  cachedRoadRef = road;
  cachedRoadBox = box;
  return box;
}

function footprintIntersectsRoad(
  fp: Footprint2D,
  road: THREE.Object3D,
): boolean {
  const roadBox = getRoadWorldBox(road);
  const footprintBox = new THREE.Box2(
    new THREE.Vector2(fp.centerX - fp.halfExtentX, fp.centerY - fp.halfExtentY),
    new THREE.Vector2(fp.centerX + fp.halfExtentX, fp.centerY + fp.halfExtentY),
  );

  const roadBoxXY = new THREE.Box2(
    new THREE.Vector2(roadBox.min.x, roadBox.min.y),
    new THREE.Vector2(roadBox.max.x, roadBox.max.y),
  );
  if (!footprintBox.intersectsBox(roadBoxXY)) {
    return false;
  }

  const samplePoints = sampleFootprintGrid(fp);
  const verticalRaycaster = new THREE.Raycaster();
  const RAY_ORIGIN_HEIGHT = 1000;

  return samplePoints.some((pt) => {
    verticalRaycaster.set(
      new THREE.Vector3(pt.x, pt.y, RAY_ORIGIN_HEIGHT),
      new THREE.Vector3(0, 0, -1),
    );
    return verticalRaycaster.intersectObject(road, true).length > 0;
  });
}
let cachedLocalSize: THREE.Vector3 | null = null;
let cachedTemplateRef: THREE.Object3D | null = null;

function getLocalFootprintSize(templateModel: THREE.Object3D): THREE.Vector3 {
  if (cachedTemplateRef === templateModel && cachedLocalSize) {
    return cachedLocalSize;
  }

  const measuringClone = templateModel.clone(true);
  measuringClone.position.set(0, 0, 0);
  measuringClone.rotation.set(0, 0, 0);
  measuringClone.scale.set(1, 1, 1);
  measuringClone.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(measuringClone);
  const size = new THREE.Vector3();
  box.getSize(size);

  cachedTemplateRef = templateModel;
  cachedLocalSize = size;
  return size;
}

function getBuildingFootprint(
  templateModel: THREE.Object3D,
  worldX: number,
  worldY: number,
  scale: number,
  rotation: number,
): Footprint2D {
  const size = getLocalFootprintSize(templateModel);

  const halfExtentX = (size.x * scale) / 2;
  const halfExtentY = (size.z * scale) / 2;

  return {
    centerX: worldX,
    centerY: worldY,
    halfExtentX,
    halfExtentY,
    rotation,
  };
}

export function useDblClickHandler(ctx: SharedMouseContext) {
  const { buildingModelRef, updateSceneGraph } = useHooks();
  const toast = useAppToast();
  const {
    sceneRef,
    cameraRef,
    loadPointsRef,
    transformControlsRef,
    carMeshesRef,
    pointsArrRef,
    roadMeshRef,
    cubeCirclesRef,
    rsuMeshesRef,
    pedestrianMeshesRef,
    modeRef,
  } = useEditorRefs();

  const rsuInactivityTimerRef = useRef<InactivityModeTimeoutHandle | null>(
    null,
  );
  if (!rsuInactivityTimerRef.current) {
    rsuInactivityTimerRef.current = createInactivityModeTimeout({
      isModeActive: () => modeRef.current.isAddPointModeActive,
      onTimeout: () => {
        modeRef.current.isAddPointModeActive = false;
      },
      timeoutMs: ADD_MODE_INACTIVITY_TIMEOUT_MS,
    });
  }

  const pedestrianInactivityTimerRef =
    useRef<InactivityModeTimeoutHandle | null>(null);
  if (!pedestrianInactivityTimerRef.current) {
    pedestrianInactivityTimerRef.current = createInactivityModeTimeout({
      isModeActive: () => modeRef.current.isAddPedestrianModeActive,
      onTimeout: () => {
        modeRef.current.isAddPedestrianModeActive = false;
      },
      timeoutMs: ADD_MODE_INACTIVITY_TIMEOUT_MS,
    });
  }

  const buildingInactivityTimerRef = useRef<InactivityModeTimeoutHandle | null>(
    null,
  );
  if (!buildingInactivityTimerRef.current) {
    buildingInactivityTimerRef.current = createInactivityModeTimeout({
      isModeActive: () => useEditorStore.getState().isBuildingMode,
      onTimeout: () => {
        useEditorStore.getState().setBuildingMode(false);
      },
      timeoutMs: ADD_MODE_INACTIVITY_TIMEOUT_MS,
    });
  }

  const waypointInactivityTimerRef = useRef<InactivityModeTimeoutHandle | null>(
    null,
  );
  if (!waypointInactivityTimerRef.current) {
    waypointInactivityTimerRef.current = createInactivityModeTimeout({
      isModeActive: () => modeRef.current.isAddedPoints,
      onTimeout: () => {
        modeRef.current.isAddedPoints = false;
      },
      timeoutMs: ADD_MODE_INACTIVITY_TIMEOUT_MS,
    });
  }

  return useCallback(
    (e: MouseEvent) => {
      if (!ctx.insideEditorCanvas(e)) return;
      const transformControls = transformControlsRef.current;
      if (!transformControls) return;
      const scene = sceneRef.current;
      if (!scene) return;
      const camera = cameraRef.current;
      if (!camera) return;
      e.preventDefault();
      e.stopPropagation();
      const road = roadMeshRef.current;
      if (!road) return;
      ctx.setMouse(e);
      ctx.raycaster.setFromCamera(ctx.mouse, camera);

      const mode = modeRef.current;
      const carMeshes = carMeshesRef.current;
      const pointsArr = pointsArrRef.current;
      const cubeCircles = cubeCirclesRef.current;
      const intersects = ctx.raycaster.intersectObjects([
        ...carMeshes,
        ...cubeCircles.flat(),
        ...pointsArr,
      ]);

      if (mode.isAddPointModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          useEditorStore.getState().addRSU(x, y, z);
          rsuInactivityTimerRef.current?.scheduleReset();
        };
        if (intersects.length > 0 && intersects[0].object === road) {
          const pt = intersects[0].point;
          addAt(pt.x, pt.y, pt.z);
        } else if (intersects.length === 0) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const pt = new THREE.Vector3();
          if (ctx.raycaster.ray.intersectPlane(plane, pt))
            addAt(pt.x, pt.y, pt.z);
        }
        return;
      }

      if (mode.isAddPedestrianModeActive) {
        const addAt = (x: number, y: number, z: number) => {
          useEditorStore.getState().addPedestrian(x, y, z);
          pedestrianInactivityTimerRef.current?.scheduleReset();
        };

        const roadHits = ctx.raycaster.intersectObjects([road], true);

        if (roadHits.length > 0) {
          const pt = roadHits[0].point;
          addAt(pt.x, pt.y, pt.z);
        } else if (intersects.length === 0) {
          const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
          const pt = new THREE.Vector3();
          if (ctx.raycaster.ray.intersectPlane(plane, pt)) {
            addAt(pt.x, pt.y, pt.z);
          }
        }
        return;
      }

      const currentSelectedId = useEditorStore.getState().selectedId;
      const selectedIdx = carMeshes.findIndex(
        (m) => m.userData.id === currentSelectedId,
      );
      if (selectedIdx >= 0 && mode.isAddedPoints) {
        e.preventDefault();
        const roadHits = ctx.raycaster.intersectObjects(
          [...carMeshes, ...cubeCircles.flat(), ...pointsArr, road],
          true,
        );
        if (roadHits.length > 0 && roadHits[0].object === road) {
          if (cubeCircles[selectedIdx]) {
            cubeCircles[selectedIdx].forEach((c) => {
              c.parent?.remove(c);
              c.geometry?.dispose();
              (c.material as THREE.Material)?.dispose();
            });
            cubeCircles[selectedIdx] = [];
          }
          const pt = roadHits[0].point;
          if (currentSelectedId) {
            useEditorStore
              .getState()
              .addPoint(currentSelectedId, pt.x, pt.y, pt.z);
            waypointInactivityTimerRef.current?.scheduleReset();
          }
          loadPointsRef.current();
          updateSceneGraph();
        }
        return;
      }

      const { isBuildingMode } = useEditorStore.getState();
      if (isBuildingMode && !mode.isAddPointModeActive && !mode.isAddedPoints) {
        const model = buildingModelRef.current;
        if (!model) return;

        const otherObjectHits = ctx.raycaster.intersectObjects(
          [
            ...carMeshes,
            ...cubeCircles.flat(),
            ...pointsArr,
            ...rsuMeshesRef.current,
            ...pedestrianMeshesRef.current,
          ],
          true,
        );
        if (otherObjectHits.length > 0) return;

        const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        const pt = new THREE.Vector3();
        if (!ctx.raycaster.ray.intersectPlane(plane, pt)) return;
        pt.z = 0;

        const newFootprint = getBuildingFootprint(model, pt.x, pt.y, 0.5, 0);

        if (footprintIntersectsRoad(newFootprint, road)) {
          toast.info(
            "Can't place building: it would overlap the road. Try a spot further from the road.",
          );
          return;
        }

        const existingBuildings = useEditorStore.getState().buildings;
        const overlapsExisting = existingBuildings.some((building) => {
          const existingFootprint = getBuildingFootprint(
            model,
            building.x,
            building.y,
            building.scale ?? 0.5,
            building.rotation ?? 0,
          );
          return checkObjectOverlap(newFootprint, existingFootprint).overlaps;
        });
        if (overlapsExisting) {
          toast.info(
            "Can't place building: it would overlap another building. Try a spot further away.",
          );
          return;
        }

        useEditorStore.getState().addBuilding(pt.x, pt.y, pt.z);
        buildingInactivityTimerRef.current?.scheduleReset();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ctx, updateSceneGraph, buildingModelRef, toast],
  );
}
