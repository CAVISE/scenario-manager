import React from 'react';
import {
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  numInputSlot,
  parseNumberFromEvent,
  getChipColor,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '@/store';

interface LocalPlannerSectionProps {
  bufferSize: number;
  trajectoryUpdateFreq: number;
  waypointUpdateFreq: number;
  minDist: number;
  trajectoryDt: number;
  debug: boolean;
  debugTrajectory: boolean;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const LocalPlannerSection = ({
  bufferSize,
  trajectoryUpdateFreq,
  waypointUpdateFreq,
  minDist,
  trajectoryDt,
  debug,
  debugTrajectory,
  onUpdate,
}: LocalPlannerSectionProps) => {
  const currentPlanner: SimulationConfig['opencda']['local_planner'] = {
    buffer_size: bufferSize,
    trajectory_update_freq: trajectoryUpdateFreq,
    waypoint_update_freq: waypointUpdateFreq,
    min_dist: minDist,
    trajectory_dt: trajectoryDt,
    debug: debug,
    debug_trajectory: debugTrajectory,
  };

  const handleNumberChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    field: keyof SimulationConfig['opencda']['local_planner'],
    min?: number,
    max?: number
  ) => {
    const val = parseNumberFromEvent(e, min, max);
    if (val === undefined) return;
    onUpdate({
      local_planner: {
        ...currentPlanner,
        [field]: val,
      },
    });
  };

  const createNumberField = (
    label: string,
    field: keyof SimulationConfig['opencda']['local_planner'],
    value: number,
    options?: {
      min?: number;
      max?: number;
      step?: number;
      tooltip?: string;
      chip?: boolean;
      chipLabel?: string;
    }
  ) => (
    <Tooltip title={options?.tooltip || ''} arrow placement="top">
      <Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1 }}>
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
          onChange={(e) =>
            handleNumberChange(e, field, options?.min, options?.max)
          }
        />
        {options?.chip && (
          <Chip
            label={options.chipLabel || value}
            size="small"
            color={getChipColor(value, options?.min, options?.max)}
            sx={{ minWidth: 40 }}
          />
        )}
      </Stack>
    </Tooltip>
  );

  const handleSwitchChange = (
    field: keyof SimulationConfig['opencda']['local_planner'],
    checked: boolean
  ) => {
    onUpdate({
      local_planner: {
        ...currentPlanner,
        [field]: checked,
      },
    });
  };

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" color="text.secondary">
        Local planner
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Buffer & update frequencies
      </Typography>
      <Stack direction="row" spacing={2}>
        {createNumberField('Buffer size', 'buffer_size', bufferSize, {
          min: 1,
          max: 1000,
          tooltip: 'Number of waypoints in buffer',
          chip: true,
          chipLabel: `${bufferSize} pts`,
        })}
        {createNumberField(
          'Traj. update freq',
          'trajectory_update_freq',
          trajectoryUpdateFreq,
          {
            min: 0.1,
            max: 100,
            step: 0.1,
            tooltip: 'Trajectory update frequency in Hz',
            chip: true,
            chipLabel: `${trajectoryUpdateFreq} Hz`,
          }
        )}
        {createNumberField(
          'Waypoint update freq',
          'waypoint_update_freq',
          waypointUpdateFreq,
          {
            min: 0.1,
            max: 100,
            step: 0.1,
            tooltip: 'Waypoint update frequency in Hz',
            chip: true,
            chipLabel: `${waypointUpdateFreq} Hz`,
          }
        )}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Path parameters
      </Typography>
      <Stack direction="row" spacing={2}>
        {createNumberField('Min dist (m)', 'min_dist', minDist, {
          min: 0.01,
          max: 100,
          step: 0.01,
          tooltip: 'Minimum distance between waypoints',
          chip: true,
          chipLabel: `${minDist} m`,
        })}
        {createNumberField('Trajectory dt (s)', 'trajectory_dt', trajectoryDt, {
          min: 0.01,
          max: 10,
          step: 0.05,
          tooltip: 'Time step for trajectory generation',
          chip: true,
          chipLabel: `${trajectoryDt} s`,
        })}
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Debug options
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center">
        <FormControlLabel
          control={
            <Switch
              checked={debug}
              onChange={(e) => handleSwitchChange('debug', e.target.checked)}
            />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Debug</span>
              <Chip
                label={debug ? 'On' : 'Off'}
                size="small"
                color={debug ? 'warning' : 'default'}
              />
            </Stack>
          }
        />
        <FormControlLabel
          control={
            <Switch
              checked={debugTrajectory}
              onChange={(e) =>
                handleSwitchChange('debug_trajectory', e.target.checked)
              }
            />
          }
          label={
            <Stack direction="row" alignItems="center" spacing={1}>
              <span>Debug traj.</span>
              <Chip
                label={debugTrajectory ? 'On' : 'Off'}
                size="small"
                color={debugTrajectory ? 'warning' : 'default'}
              />
            </Stack>
          }
        />
      </Stack>
    </Stack>
  );
};
