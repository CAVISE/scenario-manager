import { TextField } from '@mui/material';
import type { OpenCDASectionProps } from '../opencda.types';

export const WorldClientHostField = ({ oc, update }: OpenCDASectionProps) => {
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
