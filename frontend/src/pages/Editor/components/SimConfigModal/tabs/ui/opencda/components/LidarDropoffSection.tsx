import React from 'react';
import { Stack, TextField, Typography } from '@mui/material';
import {
  numInputSlot,
  parseNumberFromEvent,
  createNestedUpdate,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

interface LidarDropoffSectionProps {
  dropoffGeneralRate: number;
  dropoffIntensityLimit: number;
  dropoffZeroIntensity: number;
  noiseStddev: number;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const LidarDropoffSection = ({
  dropoffGeneralRate,
  dropoffIntensityLimit,
  dropoffZeroIntensity,
  noiseStddev,
  onUpdate,
}: LidarDropoffSectionProps) => {
  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: string,
    min?: number,
    max?: number,
  ) => {
    const val = parseNumberFromEvent(e, min, max);
    if (val === undefined) return;
    onUpdate(
      createNestedUpdate(
        'lidar_sim',
        {
          dropoff_general_rate: dropoffGeneralRate,
          dropoff_intensity_limit: dropoffIntensityLimit,
          dropoff_zero_intensity: dropoffZeroIntensity,
          noise_stddev: noiseStddev,
        },
        { [field]: val },
      ),
    );
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Vehicle sensing
      </Typography>

      <Typography variant="caption" color="text.secondary">
        LiDAR dropoff &amp; noise (vehicle + RSU)
      </Typography>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Dropoff rate"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 0.05, min: 0, max: 1 }}
          value={dropoffGeneralRate}
          onChange={(e) => handleNumberChange(e, 'dropoff_general_rate', 0, 1)}
        />
        <TextField
          label="Intensity limit"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 0.05, min: 0, max: 1 }}
          value={dropoffIntensityLimit}
          onChange={(e) =>
            handleNumberChange(e, 'dropoff_intensity_limit', 0, 1)
          }
        />
      </Stack>

      <Stack direction="row" spacing={2}>
        <TextField
          label="Zero intensity"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 0.05, min: 0, max: 1 }}
          value={dropoffZeroIntensity}
          onChange={(e) =>
            handleNumberChange(e, 'dropoff_zero_intensity', 0, 1)
          }
        />
        <TextField
          label="Noise stddev"
          type="number"
          size="small"
          fullWidth
          inputProps={{ ...numInputSlot.input, step: 0.01, min: 0 }}
          value={noiseStddev}
          onChange={(e) => handleNumberChange(e, 'noise_stddev', 0)}
        />
      </Stack>
    </Stack>
  );
};
