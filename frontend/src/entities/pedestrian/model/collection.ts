import { removeById, updateById } from '@/shared/utils/entityCollection';
import type { Pedestrian } from './types';

export type PedestrianSceneState = {
  pedestrians: Pedestrian[];
  selectedIds: string[];
};

export function updatePedestrian(
  pedestrians: Pedestrian[],
  id: string,
  patch: Partial<Pedestrian>
): Pedestrian[] {
  return updateById(pedestrians, id, patch);
}

export function removePedestrian(
  state: PedestrianSceneState,
  pedestrianId: string
): PedestrianSceneState {
  return {
    pedestrians: removeById(state.pedestrians, pedestrianId),
    selectedIds: state.selectedIds.filter((id) => id !== pedestrianId),
  };
}
