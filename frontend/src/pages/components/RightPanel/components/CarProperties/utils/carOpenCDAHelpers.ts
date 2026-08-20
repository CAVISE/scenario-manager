import { parseNumberInputChange } from '@editor/components/SimConfigModal/utils/numberInputUtils';

export const DEFAULT_CAV_COLOR: [number, number, number] = [156, 255, 206];

export function clampRgbValue(value: number): number {
  return Math.max(0, Math.min(255, value));
}

export function parseRgbValueFromEvent(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): number | undefined {
  const parsed = parseNumberInputChange(event.target);
  if (parsed === undefined || !Number.isFinite(parsed)) {
    return undefined;
  }
  return clampRgbValue(parsed);
}

export function parseNumberFromEvent(
  event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
): number | undefined {
  const parsed = parseNumberInputChange(event.target);
  if (parsed === undefined || !Number.isFinite(parsed)) {
    return undefined;
  }
  return parsed;
}
