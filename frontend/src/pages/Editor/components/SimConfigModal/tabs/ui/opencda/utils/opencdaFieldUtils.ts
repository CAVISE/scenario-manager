import * as React from 'react';
import { MenuItem } from '@mui/material';
import { numInputSlot } from '../../../../../../../components/RightPanel/types/PanelTypes';

export const createFieldUpdater =
  <T extends Record<string, unknown>>(onUpdate: (update: Partial<T>) => void) =>
  <K extends keyof T>(field: K, value: T[K]) => {
    onUpdate({ [field]: value } as unknown as Partial<T>);
  };

export const validateNumber = (
  value: number,
  min?: number,
  max?: number,
): number => {
  let result = value;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
};

export const parseNumberFromEvent = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  min?: number,
  max?: number,
): number | undefined => {
  if (e.target.value === '') return undefined;
  const val = parseFloat(e.target.value);
  if (Number.isNaN(val)) return undefined;
  return validateNumber(val, min, max);
};

export const createNumberFieldOnChange =
  (updateField: (value: number) => void, min?: number, max?: number) =>
  (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const val = parseNumberFromEvent(e, min, max);
    if (val !== undefined) updateField(val);
  };

export const formatValue = (
  value: number,
  type: 'percent' | 'speed' | 'distance' | 'default',
): string => {
  switch (type) {
    case 'percent':
      return `${value}%`;
    case 'speed':
      return value === -100 ? '2x' : `${value}%`;
    case 'distance':
      return `${value}m`;
    default:
      return String(value);
  }
};

export const getChipColor = (
  value: number,
  min?: number,
  max?: number,
  warningThreshold?: number,
):
  | 'default'
  | 'primary'
  | 'secondary'
  | 'error'
  | 'info'
  | 'success'
  | 'warning' => {
  if (min !== undefined && value === min) return 'error';
  if (max !== undefined && value > max * 0.8) return 'warning';
  if (warningThreshold !== undefined && value > warningThreshold)
    return 'warning';
  return 'default';
};

export const createSelectProps = <T extends string>(
  value: T,
  onChange: (value: T) => void,
  options: { value: T; label: string }[],
) => ({
  value,
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) =>
    onChange(e.target.value as T),
  children: options.map((opt) =>
    React.createElement(
      MenuItem,
      { key: opt.value, value: opt.value },
      opt.label,
    ),
  ),
});

export const rgbToHex = (r: number, g: number, b: number): string => {
  const clamp = (val: number) => Math.min(255, Math.max(0, Math.round(val)));
  return (
    '#' +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, '0'))
      .join('')
  );
};

export const hexToRgb = (hex: string): [number, number, number] | null => {
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
      return [r, g, b];
    }
  }
  return null;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const createNestedUpdate = <T extends Record<string, string>>(
  parentField: string,
  currentObject: T,
  updates: Partial<T>,
) => ({
  [parentField]: {
    ...currentObject,
    ...updates,
  },
});

export { numInputSlot };
