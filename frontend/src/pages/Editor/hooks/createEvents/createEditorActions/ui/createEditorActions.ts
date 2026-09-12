import { CreateEditorActionsOptions } from '../types/createEditorActionsTypes';
import { fitViewToObj } from '@editor/scene/utils/sceneHelpers';
import { useEditorStore } from '@/store';
import { FILE_ACCEPT } from '../constants/editorActions.constants';
import { deleteCar } from '../methods/carDeletion';
import { loadFileFromInput } from '../methods/fileLoader';
import { setMode } from '../methods/modeManager';

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
      loadFileFromInput(loadFile, FILE_ACCEPT);
    },

    fitView() {
      const odrMeshes = getOdrMeshes();
      if (odrMeshes.refline_lines) {
        fitViewToObj(odrMeshes.refline_lines, camera, {} as never);
      }
    },

    reload_map() {
      reloadOdrMap();
    },

    addCube() {
      setMode(modeRef, 'CAR');
      transformControls.detach();

      carMeshesRef.current.forEach((mesh) => {
        useEditorStore.getState().updateCar(mesh.userData.id, {
          rotation: mesh.rotation.z,
        });
      });

      loadPoints();
    },

    addRSU() {
      setMode(modeRef, 'RSU');
    },

    addPedestrian() {
      setMode(modeRef, 'PEDESTRIAN');
    },

    addDirectionPoints() {
      setMode(modeRef, 'DIRECTION_POINTS');
      if (useEditorStore.getState().selectedIds[0]) {
        loadPoints();
      }
    },

    deleteCube() {
      const selectedId = useEditorStore.getState().selectedIds[0];
      if (selectedId) {
        deleteCar(
          selectedId,
          carMeshesRef,
          cubeCirclesRef,
          localLineArrRef,
          transformControls,
          loadPoints
        );
      }
    },
  };
}

export type EditorActions = ReturnType<typeof createEditorActions>;
