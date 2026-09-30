export const SCENARIO_ID_RE = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/;
export const MAX_NAME_LEN = 200;
export const MAX_DESCRIPTION_LEN = 4000;
export const MAX_PREVIEW_LEN = 10_000_000;
export const MAX_OPENDRIVE_LEN = 32_000_000;
export const ALLOWED_VEHICLES = new Set([
  'car',
  'RSU',
  'building',
  'pedestrian',
]);
