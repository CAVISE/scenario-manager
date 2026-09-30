import type { Building, CreateBuildingParams } from './types';

export function createBuilding(params: CreateBuildingParams): Building {
  return {
    ...params,
    width: 20,
    depth: 20,
    height: 20,
    material: 'concrete',
    scale: 0.5,
    rotation: 0,
  };
}
