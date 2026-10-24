import React from 'react';
import {
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import { parseNumberFromEvent } from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '@/store';
import type { LocalPlannerSectionProps } from '../types/opencdaSectionTypes';
import { LocalPlannerNumberField } from './LocalPlannerNumberField';

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
        <LocalPlannerNumberField
          label="Buffer size"
          field="buffer_size"
          value={bufferSize}
          onChange={handleNumberChange}
          options={{
            min: 1,
            max: 1000,
            tooltip: 'Number of waypoints in buffer',
            chip: true,
            chipLabel: `${bufferSize} pts`,
          }}
        />
        <LocalPlannerNumberField
          label="Traj. update freq"
          field="trajectory_update_freq"
          value={trajectoryUpdateFreq}
          onChange={handleNumberChange}
          options={{
            min: 0.1,
            max: 100,
            step: 0.1,
            tooltip: 'Trajectory update frequency in Hz',
            chip: true,
            chipLabel: `${trajectoryUpdateFreq} Hz`,
          }}
        />
        <LocalPlannerNumberField
          label="Waypoint update freq"
          field="waypoint_update_freq"
          value={waypointUpdateFreq}
          onChange={handleNumberChange}
          options={{
            min: 0.1,
            max: 100,
            step: 0.1,
            tooltip: 'Waypoint update frequency in Hz',
            chip: true,
            chipLabel: `${waypointUpdateFreq} Hz`,
          }}
        />
      </Stack>

      <Typography variant="caption" color="text.secondary">
        Path parameters
      </Typography>
      <Stack direction="row" spacing={2}>
        <LocalPlannerNumberField
          label="Min dist (m)"
          field="min_dist"
          value={minDist}
          onChange={handleNumberChange}
          options={{
            min: 0.01,
            max: 100,
            step: 0.01,
            tooltip: 'Minimum distance between waypoints',
            chip: true,
            chipLabel: `${minDist} m`,
          }}
        />
        <LocalPlannerNumberField
          label="Trajectory dt (s)"
          field="trajectory_dt"
          value={trajectoryDt}
          onChange={handleNumberChange}
          options={{
            min: 0.01,
            max: 10,
            step: 0.05,
            tooltip: 'Time step for trajectory generation',
            chip: true,
            chipLabel: `${trajectoryDt} s`,
          }}
        />
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
