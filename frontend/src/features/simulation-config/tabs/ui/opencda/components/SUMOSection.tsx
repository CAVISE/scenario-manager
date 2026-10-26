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
  createNumberFieldOnChange,
} from '../utils/opencdaFieldUtils';
import { SimulationConfig } from '@/store';
import type { SumoConnectionSectionProps } from '../types/opencdaSectionTypes';
import { SumoQuickPresets } from './SumoQuickPresets';

export const SUMOSection = ({
  host,
  port,
  clientOrder,
  gui,
  onUpdate,
}: SumoConnectionSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']]
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const numberField = (
    field: keyof SimulationConfig['opencda'],
    min?: number,
    max?: number
  ) => createNumberFieldOnChange((val) => updateField(field, val), min, max);

  const handleHostChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    updateField('sumo_host', value.replace(/\s/g, ''));
  };

  const isHostValid = host.length > 0 && !host.includes(' ');
  const isPortValid = port >= 0 && port <= 65535;
  const isPortPrivileged = port < 1024;
  const isPortRegistered = port >= 1024 && port <= 49151;

  return (
    <Stack spacing={1.5}>
      <Typography
        variant="subtitle2"
        sx={{
          color: 'text.secondary',
        }}
      >
        SUMO co-simulation
      </Typography>

      <Typography
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        Connection settings
      </Typography>

      <Stack direction="row" spacing={2}>
        <Tooltip
          title="SUMO server hostname or IP address"
          arrow
          placement="top"
        >
          <Stack
            className="sim-config-field--grow"
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <TextField
              label="Host"
              size="small"
              fullWidth
              value={host}
              onChange={handleHostChange}
              placeholder="localhost"
              error={!isHostValid}
              helperText={!isHostValid ? 'Invalid host address' : ''}
            />
            {isHostValid && (
              <Chip
                label="Valid"
                size="small"
                color="success"
                className="sim-config-chip--50"
              />
            )}
          </Stack>
        </Tooltip>

        <Tooltip title="SUMO server port (0-65535)" arrow placement="top">
          <Stack
            className="sim-config-field--grow"
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <TextField
              label="Port"
              type="number"
              size="small"
              fullWidth
              value={port}
              onChange={numberField('sumo_port', 0, 65535)}
              error={!isPortValid}
              helperText={
                !isPortValid
                  ? 'Port must be between 0 and 65535'
                  : isPortPrivileged
                    ? 'Privileged port (<1024)'
                    : isPortRegistered
                      ? 'Registered port'
                      : 'Dynamic port'
              }
              slotProps={{
                htmlInput: { ...numInputSlot.input, min: 0, max: 65535 },
              }}
            />
            <Chip
              label={port}
              size="small"
              color={
                isPortValid
                  ? isPortPrivileged
                    ? 'warning'
                    : isPortRegistered
                      ? 'success'
                      : 'default'
                  : 'error'
              }
              className="sim-config-chip--50"
            />
          </Stack>
        </Tooltip>
      </Stack>

      <Typography
        className="sim-config-section-label--compact"
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        Client settings
      </Typography>

      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: 'center',
        }}
      >
        <Tooltip
          title="Client order for SUMO connection (higher = later)"
          arrow
          placement="top"
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <TextField
              label="Client order"
              type="number"
              size="small"
              value={clientOrder}
              onChange={numberField('sumo_client_order', 0)}
              className="sim-config-field--140"
              slotProps={{
                htmlInput: { ...numInputSlot.input, min: 0 },
              }}
            />
            <Chip
              label={`#${clientOrder}`}
              size="small"
              color={clientOrder > 0 ? 'default' : 'info'}
              className="sim-config-chip--30"
            />
          </Stack>
        </Tooltip>

        <FormControlLabel
          control={
            <Switch
              checked={gui}
              onChange={(e) => updateField('sumo_gui', e.target.checked)}
            />
          }
          label={
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'center',
              }}
            >
              <span>SUMO GUI</span>
              <Chip
                label={gui ? 'On' : 'Off'}
                size="small"
                color={gui ? 'success' : 'default'}
              />
            </Stack>
          }
        />
      </Stack>

      <Typography
        className="sim-config-summary"
        variant="caption"
        sx={{
          color: 'text.secondary',
        }}
      >
        SUMO connection: {isHostValid ? host : 'Invalid'}:
        {isPortValid ? port : 'Invalid'} • Client order: {clientOrder} • GUI:{' '}
        {gui ? '✅ Enabled' : '❌ Disabled'}
      </Typography>

      <SumoQuickPresets
        onSelect={(presetHost, presetPort) => {
          updateField('sumo_host', presetHost);
          updateField('sumo_port', presetPort);
        }}
      />
    </Stack>
  );
};
