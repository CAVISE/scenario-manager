export type BuildingMaterial =
  'concrete' | 'glass' | 'wood' | 'brick' | 'metal';

export type Building = {
  id: string;
  name: string;
  x: number;
  y: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  scale: number;
  rotation: number;
  material: BuildingMaterial;
};

export type CreateBuildingParams = Pick<
  Building,
  'id' | 'name' | 'x' | 'y' | 'z'
>;
