import { useEditorStore } from '../../../../../../../../../store';
import { restoreObjects } from '../../../../../../../scene/utils/restoreObjects';
import { OdrMapMeshes } from '../../../../../../useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { buildOdrScene } from '../../../../../../useOpenDriveUtils/useOdrMap';
import { BuildMapParams } from '../types/buildMapTypes';

export function buildMap({
  three,
  Module,
  OdrMap,
  odrMaterials,
  disposableObjs,
  odrMeshesRef,
  carMeshesRef,
  clearMap,
  fitView,
  resolution,
  params,
  loadRSU,
  loadPoints,
  syncRoadMesh,
  updateSceneGraph,
  buildingModelRef,
}: BuildMapParams): OdrMapMeshes {
  const { scene, camera, controls, light, transformControls, picking } = three;

  const newMeshes = buildOdrScene({
    Module,
    OpenDriveMap: OdrMap,
    scene,
    camera,
    controls,
    light,
    transformControls,
    pickingScenes: picking.scenes,
    pickingMaterials: picking.materials,
    materials: odrMaterials,
    resolution,
    params,
    disposable_objs: disposableObjs,
    clear_map: clearMap,
    fit_view: fitView,
    prevMeshes: odrMeshesRef.current,
    onDone: () => {},
  });

  odrMeshesRef.current = newMeshes;
  syncRoadMesh(newMeshes.road_network_mesh);

  restoreObjects({ scene, loadRSU, updateSceneGraph, buildingModelRef });
  loadPoints();

  const selectedId = useEditorStore.getState().selectedId;
  if (selectedId) {
    const sm = carMeshesRef.current.find((m) => m.userData.id === selectedId);
    if (sm) transformControls.attach(sm);
  }

  updateSceneGraph();

  return newMeshes;
}
