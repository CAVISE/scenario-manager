import type {
  CreateEditorActionsOptions,
  EditorActions,
} from '../types/createEditorActionsTypes';
import { fitViewToObj } from '@editor/scene/utils/sceneHelpers';
import { useEditorStore } from '@/store';
import { FILE_ACCEPT } from '../constants/editorActions.constants';
import { deleteCar } from '../methods/carDeletion';
import { loadFileFromInput } from '../methods/fileLoader';
import { setMode } from '../methods/modeManager';

export function createEditorActions(
  opts: CreateEditorActionsOptions
): EditorActions {
  const {
    modeRef,
    carMeshesRef,
    routePointMeshesRef,
    transformControls,
    localLineArrRef,
    camera,
    getOdrMeshes,
    syncRoutePointMeshes,
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

    addCar() {
      setMode(modeRef, 'CAR');
      transformControls.detach();

      carMeshesRef.current.forEach((mesh) => {
        useEditorStore.getState().updateCar(mesh.userData.id, {
          rotation: mesh.rotation.z,
        });
      });

      syncRoutePointMeshes();
    },

    addRSU() {
      setMode(modeRef, 'RSU');
    },

    addPedestrian() {
      setMode(modeRef, 'PEDESTRIAN');
    },

    startRoutePointPlacement() {
      setMode(modeRef, 'DIRECTION_POINTS');
      if (useEditorStore.getState().selectedIds[0]) {
        syncRoutePointMeshes();
      }
    },

    deleteCar() {
      const selectedId = useEditorStore.getState().selectedIds[0];
      if (selectedId) {
        deleteCar(
          selectedId,
          carMeshesRef,
          routePointMeshesRef,
          localLineArrRef,
          transformControls,
          syncRoutePointMeshes
        );
      }
    },
  };
}
