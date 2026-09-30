import { TextField } from '@mui/material';
import type { WorldClientHostFieldProps } from '../types/opencdaRareTypes';

export const WorldClientHostField = ({
  oc,
  update,
}: WorldClientHostFieldProps) => {
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
