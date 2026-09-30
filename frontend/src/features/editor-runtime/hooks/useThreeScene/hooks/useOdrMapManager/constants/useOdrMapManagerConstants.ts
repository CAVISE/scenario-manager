import type { OdrMapMeshes } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

export const EMPTY_ODR_MESHES: OdrMapMeshes = {
  refline_lines: null,
  road_network_mesh: null,
  roadmarks_mesh: null,
  lane_outline_lines: null,
  roadmark_outline_lines: null,
  ground_grid: null,
};

export const ODR_PARAMS = {
  resolution: 0.3,
  ref_line: true,
  roadmarks: true,
  view_mode: 'Default',
};
