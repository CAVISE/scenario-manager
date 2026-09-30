import { buildOdrScene } from '@editor/hooks/useOpenDriveUtils/useOdrMap';
import { OdrMapMeshes } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';
import { useEditorStore } from '@/store';
import { BuildMapParams } from '../types/buildMapTypes';

export function buildMap({
  three,
  Module,
  OdrMap,
  odrMaterials,
  disposableGeometries,
  odrMeshesRef,
  carMeshesRef,
  clearMap,
  fitView,
  resolution,
  params,
  syncRoutePointMeshes,
  syncRoadMesh,
  updateSceneGraph,
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
    disposableGeometries,
    clearMap,
    fitView,
    prevMeshes: odrMeshesRef.current,
    onDone: () => {},
  });

  odrMeshesRef.current = newMeshes;
  syncRoadMesh(newMeshes.road_network_mesh);

  syncRoutePointMeshes();

  const selectedId = useEditorStore.getState().selectedIds[0];
  if (selectedId) {
    const sm = carMeshesRef.current.find((m) => m.userData.id === selectedId);
    if (sm) transformControls.attach(sm);
  }

  updateSceneGraph();

  return newMeshes;
}
