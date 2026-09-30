import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import '@/shared/styles/opencdaPanels.scss';
import type {
  ExportProfile,
  ExportProfileSectionProps,
} from '../types/opencdaSectionTypes';

export const ExportProfileSection = ({
  exportProfile,
  onExportProfileChange,
  onLoadAimDefaults,
}: ExportProfileSectionProps) => {
  return (
    <Box className="opencda-panel">
      <Typography className="opencda-panel__label opencda-panel__label--spaced">
        Export profile
      </Typography>
      <Stack spacing={1.5}>
        <FormControl size="small" fullWidth>
          <FormLabel>Configuration profile</FormLabel>
          <Select
            value={exportProfile}
            onChange={(e) =>
              onExportProfileChange(e.target.value as ExportProfile)
            }
          >
            <option value="standard">Standard</option>
            <option value="aim_check">AIM check</option>
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          size="small"
          onClick={onLoadAimDefaults}
          className="opencda-panel__action"
        >
          Load AIM check defaults
        </Button>
      </Stack>
    </Box>
  );
};
