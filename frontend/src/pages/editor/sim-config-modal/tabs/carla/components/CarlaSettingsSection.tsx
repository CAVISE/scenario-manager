import { FormControlLabel, Stack, Switch, TextField } from '@mui/material';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import { CarlaConfig } from '../utils/carlaUtils';

type Props = {
  carla: CarlaConfig;
  update: (patch: Partial<CarlaConfig>) => void;
};

export const CarlaSettingsSection = ({ carla, update }: Props) => (
  <>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Vehicles"
        type="number"
        size="small"
        fullWidth
        value={carla.num_vehicles}
        onChange={(e) =>
          update({ num_vehicles: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="Pedestrians"
        type="number"
        size="small"
        fullWidth
        value={carla.num_pedestrians}
        onChange={(e) =>
          update({ num_pedestrians: parseNumberInputChange(e.target) })
        }
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Client Port"
        type="number"
        size="small"
        fullWidth
        value={carla.client_port}
        onChange={(e) =>
          update({ client_port: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="Seed"
        type="number"
        size="small"
        fullWidth
        value={carla.seed}
        onChange={(e) => update({ seed: parseNumberInputChange(e.target) })}
      />
    </Stack>
    <Stack direction="row" spacing={2}>
      <TextField
        label="Fixed Delta (s)"
        type="number"
        size="small"
        fullWidth
        inputProps={{ step: 0.01 }}
        value={carla.fixed_delta_seconds}
        onChange={(e) =>
          update({ fixed_delta_seconds: parseNumberInputChange(e.target) })
        }
      />
      <TextField
        label="TM Port"
        type="number"
        size="small"
        fullWidth
        inputProps={{ min: 1, max: 65535, step: 1 }}
        value={carla.traffic_manager_port}
        onChange={(e) =>
          update({ traffic_manager_port: parseNumberInputChange(e.target) })
        }
      />
    </Stack>
    <FormControlLabel
      control={
        <Switch
          checked={carla.synchronous_mode}
          onChange={(e) => update({ synchronous_mode: e.target.checked })}
        />
      }
      label="Synchronous Mode"
    />
  </>
);
