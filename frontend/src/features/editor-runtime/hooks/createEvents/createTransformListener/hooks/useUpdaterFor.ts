import { useEditorStore } from '@/store';
import { MoveKind } from '../types/createTransformListenerTypes';

export function updaterFor(kind: MoveKind, id: string): (p: object) => void {
  switch (kind) {
    case 'car':
      return (p) => useEditorStore.getState().updateCar(id, p);
    case 'rsu':
      return (p) => useEditorStore.getState().updateRSU(id, p);
    case 'lidar':
      return (p) => useEditorStore.getState().updateLidar(id, p);
    case 'building':
      return (p) => useEditorStore.getState().updateBuilding(id, p);
    case 'pedestrian':
      return (p) => useEditorStore.getState().updatePedestrian(id, p);
    case 'point':
      return (p) => useEditorStore.getState().updatePoint(id, p);
  }
}
