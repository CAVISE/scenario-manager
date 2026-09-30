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
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import type { CapiSectionProps, ServiceBoxProps } from '../types/capiTypes';

const ServiceBox = ({
  enabled,
  port,
  onEnabledChange,
  onPortChange,
  children,
  label,
}: ServiceBoxProps) => (
  <Box className="sim-config-card">
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
            className="sim-config-field--120"
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

export const ServicesSection = ({ capi, update }: CapiSectionProps) => (
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
