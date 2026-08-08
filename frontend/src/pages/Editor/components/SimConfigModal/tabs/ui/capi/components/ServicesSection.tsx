import {
  Box,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { updateStringField, updateSwitchField } from '../utils/capiFieldUtils';
import { CapiConfig } from '../hooks/useCapiConfig';
import { parseNumberInputChange } from '../../../../utils/numberInputUtils';

type Props = {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
};

const ServiceBox = ({
  enabled,
  port,
  onEnabledChange,
  onPortChange,
  children,
  label,
}: {
  enabled: boolean;
  port: number;
  onEnabledChange: (checked: boolean) => void;
  onPortChange: (value: number) => void;
  children?: React.ReactNode;
  label: string;
}) => (
  <Box
    sx={{
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 1,
      p: 1.5,
    }}
  >
    <Stack spacing={1}>
      <FormControlLabel
        control={
          <Switch
            checked={enabled}
            onChange={(e) => onEnabledChange(e.target.checked)}
          />
        }
        label={label}
      />
      {enabled && (
        <Stack direction="row" spacing={1}>
          <TextField
            label="Port"
            type="number"
            size="small"
            sx={{ width: 120 }}
            value={port}
            onChange={(e) =>
              onPortChange(parseNumberInputChange(e.target) || 0)
            }
          />
          {children}
        </Stack>
      )}
    </Stack>
  </Box>
);

export const ServicesSection = ({ capi, update }: Props) => (
  <>
    <Divider />
    <Typography variant="subtitle2" color="text.secondary">
      Services (services.xml)
    </Typography>

    <ServiceBox
      enabled={capi.ca_service_enabled}
      port={capi.ca_service_port}
      onEnabledChange={(checked) =>
        updateSwitchField(checked, 'ca_service_enabled', update)
      }
      onPortChange={(value) => update({ ca_service_port: value })}
      label="CaService"
    />

    <ServiceBox
      enabled={capi.cosim_service_enabled}
      port={capi.cosim_service_port}
      onEnabledChange={(checked) =>
        updateSwitchField(checked, 'cosim_service_enabled', update)
      }
      onPortChange={(value) => update({ cosim_service_port: value })}
      label="CosimService"
    >
      <TextField
        label="Filter pattern"
        size="small"
        fullWidth
        placeholder="(cav|rsu)-.*"
        value={capi.cosim_filter_pattern}
        onChange={(e) => updateStringField(e, 'cosim_filter_pattern', update)}
      />
    </ServiceBox>
  </>
);
