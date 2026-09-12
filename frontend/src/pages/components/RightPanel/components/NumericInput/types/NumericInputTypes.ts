export type NumericInputProps = {
  value: number;
  onValueChange: (value: number) => void;
  precision?: number;
  variant?: 'standard' | 'outlined';
};

export const formatValue = (value: number, precision: number) =>
  Number.isFinite(value) ? value.toFixed(precision) : '';
