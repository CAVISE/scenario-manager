import { TextField } from '@mui/material';
import { SimulationConfig } from '../../../../generators/generators.types';

type Props = {
  oc: Partial<SimulationConfig['opencda']>;
  update: (patch: Partial<SimulationConfig['opencda']>) => void;
};

export const WorldClientHostField = ({ oc, update }: Props) => {
  if (!oc.export_world_client_host) return null;

  return (
    <TextField
      label="world.client_host"
      size="small"
      fullWidth
      value={oc.world_client_host}
      onChange={(e) => update({ world_client_host: e.target.value })}
    />
  );
};
