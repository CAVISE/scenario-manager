import {
  Button,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { getNetFilePath } from '../utils/sumoUtils';
import type { SumoFilesSectionProps } from '../sumo.types';

export const SumoFilesSection = ({
  sumo,
  carlaMap,
  loadedNetFilename,
  onUpdate,
  onLoadNetwork,
  onNetFileChange,
}: SumoFilesSectionProps) => {
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await onLoadNetwork(file);
    onNetFileChange(file.name);
    event.target.value = '';
  };

  return (
    <>
      <Typography variant="subtitle2" color="text.secondary">
        Files
      </Typography>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Scenario name"
          size="small"
          fullWidth
          placeholder="scenario"
          value={sumo.scenario_name}
          onChange={(e) => onUpdate({ scenario_name: e.target.value })}
        />
        <TextField
          label="Net file"
          size="small"
          fullWidth
          value={getNetFilePath(carlaMap)}
          InputProps={{ readOnly: true }}
          helperText="Derived from the selected CARLA map"
        />
      </Stack>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button component="label" size="small" variant="outlined">
          Load SUMO network
          <input
            hidden
            type="file"
            accept=".net.xml,.xml"
            onChange={handleFileChange}
          />
        </Button>
        <Typography variant="caption" color="text.secondary">
          {loadedNetFilename
            ? `Loaded: ${loadedNetFilename}`
            : 'Not loaded; the exporter will try the displayed local path'}
        </Typography>
      </Stack>
      <FormControlLabel
        control={
          <Switch
            checked={sumo.full_output}
            onChange={(e) => onUpdate({ full_output: e.target.checked })}
          />
        }
        label="Full output (sumo_full_output.xml)"
      />
    </>
  );
};
