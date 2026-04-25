import * as THREE from 'three';

import { CreateEditorActionsOptions } from '../types/createEditorActionsTypes';
import { fitViewToObj } from '../../../../scene/utils/sceneHelpers';
import { useEditorStore } from '../../../../../../store';

export function createEditorActions(opts: CreateEditorActionsOptions) {
  const {
    modeRef,
    carMeshesRef,
    cubeCirclesRef,
    transformControls,
    localLineArrRef,
    camera,
    getOdrMeshes,
    loadPoints,
    loadFile,
    reloadOdrMap,
  } = opts;

  return {
    load_file() {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xodr';
      input.addEventListener('change', (ev: Event) => {
        const file = (ev.target as HTMLInputElement).files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          if (typeof e.target?.result === 'string')
            loadFile(e.target.result, true);
        };
        reader.readAsText(file);
      });
      input.click();
    },

    fitView() {
      const odrMeshes = getOdrMeshes();
      if (odrMeshes.refline_lines)
        fitViewToObj(odrMeshes.refline_lines, camera, {} as never);
    },

    reload_map() {
      reloadOdrMap();
    },

    addCube() {
      modeRef.current.isAddCarModeActive = true;
      modeRef.current.isAddPointModeActive = false;
      modeRef.current.isAddedPoints = false;
      useEditorStore.getState().setBuildingMode(false);
      transformControls.detach();
      carMeshesRef.current.forEach((m) =>
        useEditorStore
          .getState()
          .updateCar(m.userData.id, { rotation: m.rotation.z }),
      );
      loadPoints();
    },

    addRSU() {
      modeRef.current.isAddedPoints = false;
      modeRef.current.isAddPointModeActive = true;
      modeRef.current.isAddCarModeActive = false;
      modeRef.current.isAddPedestrianModeActive = false;
      useEditorStore.getState().setBuildingMode(false);
    },

    addPedestrian() {
      modeRef.current.isAddedPoints = false;
      modeRef.current.isAddPointModeActive = false;
      modeRef.current.isAddCarModeActive = false;
      modeRef.current.isAddPedestrianModeActive = true;
      useEditorStore.getState().setBuildingMode(false);
    },

    addDirectionPoints() {
      if (useEditorStore.getState().selectedId) {
        modeRef.current.isAddedPoints = true;
        modeRef.current.isAddCarModeActive = false;
        modeRef.current.isAddPointModeActive = false;
        modeRef.current.isAddPedestrianModeActive = false;
        useEditorStore.getState().setBuildingMode(false);
        loadPoints();
      }
    },

    deleteCube() {
      const selectedCarId = useEditorStore.getState().selectedId;
      const idx = carMeshesRef.current.findIndex(
        (m) => m.userData.id === selectedCarId,
      );
      if (idx < 0) return;

      localLineArrRef.current[idx]?.forEach((l) => {
        l.parent?.remove(l);
        l.geometry?.dispose();
        (l.material as THREE.Material)?.dispose();
      });
      localLineArrRef.current.splice(idx, 1);

      cubeCirclesRef.current[idx]?.forEach((c) => {
        c.parent?.remove(c);
        c.geometry?.dispose();
        (c.material as THREE.Material)?.dispose();
      });
      cubeCirclesRef.current.splice(idx, 1);

      if (selectedCarId)
        useEditorStore.getState().removePointsByCarId(selectedCarId);

      const mesh = carMeshesRef.current[idx];
      if (mesh) {
        mesh.parent?.remove(mesh);
        mesh.traverse((child) => {
          const m = child as THREE.Mesh;
          if (m.isMesh) {
            m.geometry?.dispose();
            (Array.isArray(m.material) ? m.material : [m.material]).forEach(
              (mt) => mt?.dispose(),
            );
          }
        });
        carMeshesRef.current.splice(idx, 1);
        useEditorStore.getState().removeCar(mesh.userData.id);
      }

      transformControls.detach();
      useEditorStore.getState().selectObject(null);
      loadPoints();
    },
  };
}

export type EditorActions = ReturnType<typeof createEditorActions>;
