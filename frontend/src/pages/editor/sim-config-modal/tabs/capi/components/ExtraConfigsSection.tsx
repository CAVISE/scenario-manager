import {
  Box,
  Button,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import type {
  SimulationConfig,
  CAPIExtraConfig,
} from '../../../../generators/generators.types';

type CapiConfig = SimulationConfig['capi'];

type Props = {
  capi: CapiConfig;
  update: (patch: Partial<CapiConfig>) => void;
};

const createDefaultConfig = (): CAPIExtraConfig => ({
  name: 'custom',
  path_loss_type: 'Gemv2',
  small_scale_variations: false,
  visualization: false,
});

export const ExtraConfigsSection = ({ capi, update }: Props) => {
  const handleAddConfig = () => {
    update({
      extra_configs: [...capi.extra_configs, createDefaultConfig()],
    });
  };

  const handleRemoveConfig = (index: number) => {
    update({
      extra_configs: capi.extra_configs.filter((_, i) => i !== index),
    });
  };

  const handleConfigChange = <K extends keyof CAPIExtraConfig>(
    index: number,
    field: K,
    value: CAPIExtraConfig[K],
  ) => {
    const updated = [...capi.extra_configs];
    updated[index] = { ...updated[index], [field]: value };
    update({ extra_configs: updated });
  };

  return (
    <>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">
          Extra configs ([Config ...])
        </Typography>
        <Button size="small" variant="outlined" onClick={handleAddConfig}>
          + Add config
        </Button>
      </Stack>

      {capi.extra_configs.map((ec, i) => (
        <Box
          key={i}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1.5,
          }}
        >
          <Stack spacing={1}>
            <Stack direction="row" spacing={1}>
              <TextField
                label="Name"
                size="small"
                fullWidth
                placeholder="gemv2"
                value={ec.name}
                onChange={(e) => handleConfigChange(i, 'name', e.target.value)}
              />
              <TextField
                label="Path loss type"
                size="small"
                fullWidth
                placeholder="Gemv2"
                value={ec.path_loss_type}
                onChange={(e) =>
                  handleConfigChange(i, 'path_loss_type', e.target.value)
                }
              />
            </Stack>
            <Stack direction="row" gap={1} alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={ec.small_scale_variations}
                    onChange={(e) =>
                      handleConfigChange(
                        i,
                        'small_scale_variations',
                        e.target.checked,
                      )
                    }
                  />
                }
                label="Small scale variations"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={ec.visualization}
                    onChange={(e) =>
                      handleConfigChange(i, 'visualization', e.target.checked)
                    }
                  />
                }
                label="Visualization"
              />
              <Button
                size="small"
                color="error"
                onClick={() => handleRemoveConfig(i)}
              >
                Remove
              </Button>
            </Stack>
          </Stack>
        </Box>
      ))}
    </>
  );
};
