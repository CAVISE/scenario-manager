import {
  Box,
  Button,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { parseNumberInputChange } from '../../../../../../shared/utils/numberInput';
import { createDefaultVType, SumoConfig } from '../utils/sumoUtils';

type Props = {
  sumo: SumoConfig;
  onUpdate: (patch: Partial<SumoConfig>) => void;
};

export const VTypesSection = ({ sumo, onUpdate }: Props) => {
  const handleAddVType = () => {
    onUpdate({
      vtypes: [...sumo.vtypes, createDefaultVType(sumo.vtypes.length)],
    });
  };

  const handleRemoveVType = (index: number) => {
    onUpdate({
      vtypes: sumo.vtypes.filter((_, j) => j !== index),
    });
  };

  const handleVTypeChange = <K extends keyof SumoConfig['vtypes'][number]>(
    index: number,
    field: K,
    value: SumoConfig['vtypes'][number][K],
  ) => {
    const vtypes = [...sumo.vtypes];
    vtypes[index] = { ...vtypes[index], [field]: value };
    onUpdate({ vtypes });
  };

  return (
    <>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle2" color="text.secondary">
          Vehicle types (vTypes)
        </Typography>
        <Button size="small" variant="outlined" onClick={handleAddVType}>
          + Add vType
        </Button>
      </Stack>

      {sumo.vtypes.map((vt, i) => (
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
                label="ID"
                size="small"
                fullWidth
                value={vt.id}
                onChange={(e) => handleVTypeChange(i, 'id', e.target.value)}
              />
              <TextField
                label="vClass"
                size="small"
                fullWidth
                value={vt.vClass}
                onChange={(e) => handleVTypeChange(i, 'vClass', e.target.value)}
              />
            </Stack>
            <Stack direction="row" spacing={1}>
              <TextField
                label="minGap"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.1 }}
                value={vt.minGap}
                onChange={(e) =>
                  handleVTypeChange(
                    i,
                    'minGap',
                    parseNumberInputChange(e.target) || 0,
                  )
                }
              />
              <TextField
                label="tau"
                type="number"
                size="small"
                fullWidth
                inputProps={{ step: 0.1 }}
                value={vt.tau}
                onChange={(e) =>
                  handleVTypeChange(
                    i,
                    'tau',
                    parseNumberInputChange(e.target) || 0,
                  )
                }
              />
              <TextField
                label="carFollowModel"
                size="small"
                fullWidth
                value={vt.carFollowModel}
                onChange={(e) =>
                  handleVTypeChange(i, 'carFollowModel', e.target.value)
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                label="speedFactor"
                size="small"
                fullWidth
                value={vt.speedFactor}
                onChange={(e) =>
                  handleVTypeChange(i, 'speedFactor', e.target.value)
                }
              />
              <Button
                size="small"
                color="error"
                onClick={() => handleRemoveVType(i)}
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
