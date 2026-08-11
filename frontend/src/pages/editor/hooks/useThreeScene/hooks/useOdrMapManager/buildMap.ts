import { useEditorStore } from '../../../../../../store';
import { restoreObjects } from '../../../../scene/restoreObjects';
import { OdrMapMeshes } from '../../../useOdrMap.types';
import { buildOdrScene } from '../../../useOdrMap';
import { BuildMapParams } from './buildMap.types';

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
