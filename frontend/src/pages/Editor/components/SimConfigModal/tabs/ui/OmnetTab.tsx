import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import { useEditorStore } from '../../../../../../store';

export default function OmnetTab() {
  const updateSimConfigOmnet = useEditorStore((s) => s.updateSimConfigOmnet);
  const simConfig = useEditorStore((s) => s.simConfig);
  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2}>
        <TextField
          label="TX Power (mW)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.omnet.tx_power}
          onChange={(e) =>
            updateSimConfigOmnet({ tx_power: Number(e.target.value) })
          }
        />
        <TextField
          label="Bitrate (Mbps)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.omnet.bitrate}
          onChange={(e) =>
            updateSimConfigOmnet({ bitrate: Number(e.target.value) })
          }
        />
      </Stack>
      <Stack direction="row" spacing={2}>
        <TextField
          label="Beacon Interval (ms)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.omnet.beaconing_interval}
          onChange={(e) =>
            updateSimConfigOmnet({ beaconing_interval: Number(e.target.value) })
          }
        />
        <TextField
          label="Max Interf. Dist (m)"
          type="number"
          size="small"
          fullWidth
          value={simConfig.omnet.max_interf_dist}
          onChange={(e) =>
            updateSimConfigOmnet({ max_interf_dist: Number(e.target.value) })
          }
        />
      </Stack>
      <FormControl size="small" fullWidth>
        <InputLabel>Protocol</InputLabel>
        <Select
          value={simConfig.omnet.protocol}
          label="Protocol"
          onChange={(e) =>
            updateSimConfigOmnet({
              protocol: e.target.value as 'ITS-G5' | 'C-V2X',
            })
          }
        >
          <MenuItem value="ITS-G5">ITS-G5 (IEEE 802.11p)</MenuItem>
          <MenuItem value="C-V2X">C-V2X (LTE/5G)</MenuItem>
        </Select>
      </FormControl>
    </Stack>
  );
}
