import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import {
  opencdaPanelPaperSx,
  opencdaSectionLabelSx,
} from '../../../../../../shared/styles/opencdaUiStyles';

interface ExportProfileSectionProps {
  exportProfile: 'standard' | 'aim_check';
  onExportProfileChange: (value: 'standard' | 'aim_check') => void;
  onLoadAimDefaults: () => void;
}

export const ExportProfileSection = ({
  exportProfile,
  onExportProfileChange,
  onLoadAimDefaults,
}: ExportProfileSectionProps) => {
  return (
    <Box sx={opencdaPanelPaperSx}>
      <Typography sx={{ ...opencdaSectionLabelSx, mb: 1.5 }}>
        Export profile
      </Typography>
      <Stack spacing={1.5}>
        <FormControl size="small" fullWidth>
          <FormLabel>Configuration profile</FormLabel>
          <Select
            value={exportProfile}
            onChange={(e) =>
              onExportProfileChange(e.target.value as 'standard' | 'aim_check')
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
          sx={{ alignSelf: 'flex-start' }}
        >
          Load AIM check defaults
        </Button>
      </Stack>
    </Box>
  );
};
