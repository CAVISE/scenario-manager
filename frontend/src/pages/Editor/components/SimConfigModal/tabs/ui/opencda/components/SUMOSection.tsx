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
import { SimulationConfig } from '../../../../../../Generators/types/configGeneratorsTypes';

interface SUMOSectionProps {
  host: string;
  port: number;
  clientOrder: number;
  gui: boolean;
  onUpdate: (update: Partial<SimulationConfig['opencda']>) => void;
}

export const SUMOSection = ({
  host,
  port,
  clientOrder,
  gui,
  onUpdate,
}: SUMOSectionProps) => {
  const updateField = (
    field: keyof SimulationConfig['opencda'],
    value: SimulationConfig['opencda'][keyof SimulationConfig['opencda']],
  ) => {
    onUpdate({ [field]: value } as Partial<SimulationConfig['opencda']>);
  };

  const numberField = (
    field: keyof SimulationConfig['opencda'],
    min?: number,
    max?: number,
  ) => createNumberFieldOnChange((val) => updateField(field, val), min, max);

  const handleHostChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
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
      <Typography variant="subtitle2" color="text.secondary">
        SUMO co-simulation
      </Typography>

      <Typography variant="caption" color="text.secondary">
        Connection settings
      </Typography>

      <Stack direction="row" spacing={2}>
        <Tooltip
          title="SUMO server hostname or IP address"
          arrow
          placement="top"
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flex: 1 }}
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
                sx={{ minWidth: 50 }}
              />
            )}
          </Stack>
        </Tooltip>

        <Tooltip title="SUMO server port (0-65535)" arrow placement="top">
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{ flex: 1 }}
          >
            <TextField
              label="Port"
              type="number"
              size="small"
              fullWidth
              inputProps={{ ...numInputSlot.input, min: 0, max: 65535 }}
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
              sx={{ minWidth: 50 }}
            />
          </Stack>
        </Tooltip>
      </Stack>

      <Typography variant="caption" color="text.secondary" sx={{ pt: 0.5 }}>
        Client settings
      </Typography>

      <Stack direction="row" spacing={2} alignItems="center">
        <Tooltip
          title="Client order for SUMO connection (higher = later)"
          arrow
          placement="top"
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              label="Client order"
              type="number"
              size="small"
              inputProps={{ ...numInputSlot.input, min: 0 }}
              value={clientOrder}
              onChange={numberField('sumo_client_order', 0)}
              sx={{ width: 140 }}
            />
            <Chip
              label={`#${clientOrder}`}
              size="small"
              color={clientOrder > 0 ? 'default' : 'info'}
              sx={{ minWidth: 30 }}
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
            <Stack direction="row" alignItems="center" spacing={1}>
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

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
        SUMO connection: {isHostValid ? host : 'Invalid'}:
        {isPortValid ? port : 'Invalid'} • Client order: {clientOrder} • GUI:{' '}
        {gui ? '✅ Enabled' : '❌ Disabled'}
      </Typography>

      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Quick presets:
        </Typography>
        <Typography
          variant="caption"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'underline',
          }}
          onClick={() => {
            updateField('sumo_host', 'localhost');
            updateField('sumo_port', 8813);
          }}
        >
          localhost:8813
        </Typography>
        <Typography
          variant="caption"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'underline',
          }}
          onClick={() => {
            updateField('sumo_host', '127.0.0.1');
            updateField('sumo_port', 8813);
          }}
        >
          127.0.0.1:8813
        </Typography>
        <Typography
          variant="caption"
          sx={{
            cursor: 'pointer',
            color: 'primary.main',
            textDecoration: 'underline',
          }}
          onClick={() => {
            updateField('sumo_host', 'localhost');
            updateField('sumo_port', 8814);
          }}
        >
          localhost:8814
        </Typography>
      </Stack>
    </Stack>
  );
};
