import { removeById, updateById } from '@/shared/utils/entityCollection';
import type { Building } from './types';

export function updateBuilding(
  buildings: Building[],
  id: string,
  patch: Partial<Building>
): Building[] {
  return updateById(buildings, id, patch);
}

export function removeBuilding(buildings: Building[], id: string): Building[] {
  return removeById(buildings, id);
}
