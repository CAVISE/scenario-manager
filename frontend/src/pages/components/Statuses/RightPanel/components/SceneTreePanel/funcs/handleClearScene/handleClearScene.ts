import { disposeMesh } from "../sceneUtils/sceneUtils";
import * as THREE from 'three';
import { useEditorStore } from "../../../../../../../../store/useEditorStore";
import { handleClearSceneProps } from "./types/handleClearSceneTypes";
export function handleClearScene({carMeshesRef, sceneRef, cubeCirclesRef, pointsArrRef, transformControlsRef, onDetach}: handleClearSceneProps){
  const s = useEditorStore.getState();
  
      [...carMeshesRef.current].forEach(mesh => {
        disposeMesh(mesh);
        sceneRef.current?.remove(mesh);
      });
      carMeshesRef.current.length = 0;
  
      cubeCirclesRef.current.forEach(circles => {
        circles.forEach(c => {
          c.parent?.remove(c);
          c.geometry?.dispose();
          (c.material as THREE.Material)?.dispose();
        });
      });
      cubeCirclesRef.current.length = 0;
  
      pointsArrRef.current.forEach(mesh => {
        mesh.parent?.remove(mesh);
        mesh.geometry?.dispose();
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        materials.forEach(mt => mt?.dispose());
      });
      pointsArrRef.current.length = 0;
  
      [...s.buildings].forEach(b => {
        const mesh = sceneRef.current?.children.find(c => c.userData.id === b.id);
        if (mesh) {
          disposeMesh(mesh);
          sceneRef.current?.remove(mesh);
        }
        s.removeBuilding(b.id);
      });
  
      [...s.cars].forEach(c => s.removeCar(c.id));
      [...s.RSUs].forEach(() => s.removeRSU(0));
      [...s.points].forEach(p => s.removePoint(p.id));
      [...s.pedestrians].forEach(p => s.removePedestrian(p.id));
      [...s.lidars].forEach(l => s.removeLidar(l.id));
  
      s.selectObject(null);
      transformControlsRef.current?.detach();
      onDetach();
}