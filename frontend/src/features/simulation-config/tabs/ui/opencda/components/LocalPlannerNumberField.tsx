import React from 'react';
import { Chip, Stack, TextField, Tooltip } from '@mui/material';
import { SimulationConfig } from '@/store';
import { getChipColor, numInputSlot } from '../utils/opencdaFieldUtils';

type LocalPlanner = SimulationConfig['opencda']['local_planner'];

interface LocalPlannerNumberFieldProps {
  label: string;
  field: keyof LocalPlanner;
  value: number;
  options?: {
    min?: number;
    max?: number;
    step?: number;
    tooltip?: string;
    chip?: boolean;
    chipLabel?: string;
  };
  onChange: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof LocalPlanner,
    min?: number,
    max?: number
  ) => void;
}

export function LocalPlannerNumberField({
  label,
  field,
  value,
  options,
  onChange,
}: LocalPlannerNumberFieldProps) {
  return (
    <Tooltip title={options?.tooltip || ''} arrow placement="top">
      <Stack
        className="sim-config-field--grow"
        direction="row"
        spacing={1}
        alignItems="center"
      >
        <TextField
          label={label}
          type="number"
          size="small"
          fullWidth
          inputProps={{
            ...numInputSlot.input,
            min: options?.min,
            max: options?.max,
            step: options?.step || 1,
          }}
          value={value}
          onChange={(event) =>
            onChange(event, field, options?.min, options?.max)
          }
        />
        {options?.chip && (
          <Chip
            label={options.chipLabel || value}
            size="small"
            color={getChipColor(value, options?.min, options?.max)}
            className="sim-config-chip--40"
          />
        )}
      </Stack>
    </Tooltip>
  );
}
