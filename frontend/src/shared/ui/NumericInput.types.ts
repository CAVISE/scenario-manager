export interface NumericInputProps {
  value: number;
  onValueChange: (value: number) => void;
  precision?: number;
  variant?: 'standard' | 'outlined';
}
