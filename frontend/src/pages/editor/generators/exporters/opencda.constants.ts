export const YAML_RESERVED_STRINGS = new Set([
  'true',
  'false',
  'null',
  'yes',
  'no',
  'on',
  'off',
  '~',
]);

export const CAMERA_POSITIONS = [
  '[2.5, 0, 1.0, 0]',
  '[0.0, 0.3, 1.8, 100]',
  '[0.0, -0.3, 1.8, -100]',
  '[-2.0, 0.0, 1.5, 180]',
];

export const MAX_CAMERA_POSITIONS = CAMERA_POSITIONS.length;
export const OPEN_CDA_WORLD_TIMESTEP = '${world.fixed_delta_seconds}';
