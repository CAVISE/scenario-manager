import type { EntityItem, EntityKind } from '@/store/utils/sceneEntities';

export type BatchField = {
  key: string;
  label: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  color?: boolean;
};

const typeFields: Record<EntityKind, BatchField[]> = {
  car: [
    { key: 'speed', label: 'Speed (km/h)', min: 0, max: 250 },
    { key: 'color', label: 'Color', color: true },
    { key: 'scale', label: 'Scale', min: 0.1, max: 5, step: 0.1 },
    { key: 'rotation', label: 'Rotation (rad)', step: 0.01 },
  ],
  rsu: [
    { key: 'range', label: 'Range (m)', min: 0 },
    { key: 'tx_power', label: 'Transmit power (dBm)' },
    {
      key: 'protocol',
      label: 'Protocol',
      options: ['ITS-G5', 'C-V2X', 'DSRC'],
    },
  ],
  building: [
    { key: 'height', label: 'Height (m)', min: 0.1 },
    {
      key: 'material',
      label: 'Material',
      options: ['concrete', 'glass', 'wood', 'brick', 'metal'],
    },
    { key: 'scale', label: 'Scale', min: 0.1, max: 5, step: 0.1 },
    { key: 'rotation', label: 'Rotation (rad)', step: 0.01 },
  ],
  pedestrian: [
    { key: 'speed', label: 'Speed (m/s)', min: 0 },
    { key: 'protocol', label: 'Protocol', options: ['DSRC', 'C-V2X'] },
  ],
  lidar: [
    { key: 'range', label: 'Range (m)', min: 0.1 },
    { key: 'channels', label: 'Channels', min: 1, step: 1 },
    { key: 'rotation_frequency', label: 'Rotation frequency (Hz)', min: 0.1 },
  ],
  point: [],
};

export function getBatchFields(items: EntityItem[]): BatchField[] {
  if (!items.length) return [];
  const sameType = items.every((item) => item.type === items[0].type);
  // Sensor positions are local offsets; other entities use world coordinates.
  const positions =
    items.some((item) => item.type === 'lidar') && !sameType
      ? []
      : ['x', 'y', 'z'].map((key) => ({
          key,
          label: `${items[0].type === 'lidar' ? 'Local offset' : 'Position'} ${key.toUpperCase()} (m)`,
          step: 0.1,
        }));
  return [...positions, ...(sameType ? typeFields[items[0].type] : [])];
}

export function getCommonValue(
  items: EntityItem[],
  key: string
): string | number | null {
  const values = items.map(
    (item) => (item.entity as unknown as Record<string, unknown>)[key]
  );
  const first = values[0];
  return (typeof first === 'string' || typeof first === 'number') &&
    values.every((value) => value === first)
    ? first
    : null;
}

export function parseBatchValue(
  field: BatchField,
  raw: string
): string | number | null {
  if (!raw.trim()) return null;
  if (field.options) return field.options.includes(raw) ? raw : null;
  if (field.color)
    return /^#?[\da-f]{6}$/i.test(raw)
      ? raw.replace('#', '').toLowerCase()
      : null;
  const value = Number(raw);
  if (!Number.isFinite(value)) return null;
  if (field.min !== undefined && value < field.min) return null;
  if (field.max !== undefined && value > field.max) return null;
  if (field.key === 'channels' && !Number.isInteger(value)) return null;
  return value;
}
