export const formatValue = (value: number, precision: number): string =>
  Number.isFinite(value) ? value.toFixed(precision) : '';
