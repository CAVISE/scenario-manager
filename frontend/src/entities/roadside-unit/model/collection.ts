import { removeByIndex, updateById } from '@/shared/utils/entityCollection';
import type { RSU } from './types';

export function removeRsuAtIndex(rsus: RSU[], index: number): RSU[] {
  return removeByIndex(rsus, index);
}

export function updateRsu(rsus: RSU[], id: string, patch: Partial<RSU>): RSU[] {
  return updateById(rsus, id, patch);
}
