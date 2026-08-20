import { FormControlLabel, Stack, Switch } from '@mui/material';
import { NumField } from '../rareComponents/NumField';
import OpenCDACollapsibleSection from '../../../../components/OpenCDACollapsibleSection';
import { SimulationConfig } from '@/store';
type Oc = SimulationConfig['opencda'];
type Props = {
  mapManager: Oc['map_manager'];
  patch: (p: Partial<Oc['map_manager']>) => void;
};

export const MapManagerSection = ({ mapManager, patch }: Props) => (
  <OpenCDACollapsibleSection title="map_manager">
    <Stack spacing={1}>
      <NumField
        label="pixels_per_meter"
        value={mapManager.pixels_per_meter}
        onChange={(v) => patch({ pixels_per_meter: v })}
        min={0.1}
        step={0.1}
      />
      <Stack direction="row" spacing={1}>
        <NumField
          label="raster W"
          value={mapManager.raster_size[0]}
          onChange={(v) =>
            patch({ raster_size: [v, mapManager.raster_size[1]] })
          }
          min={1}
        />
        <NumField
          label="raster H"
          value={mapManager.raster_size[1]}
          onChange={(v) =>
            patch({ raster_size: [mapManager.raster_size[0], v] })
          }
          min={1}
        />
      </Stack>
      <NumField
        label="lane_sample_resolution"
        value={mapManager.lane_sample_resolution}
        onChange={(v) => patch({ lane_sample_resolution: v })}
        step={0.01}
        min={0.01}
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={mapManager.activate}
            onChange={(e) => patch({ activate: e.target.checked })}
          />
        }
        label="activate"
      />
      <FormControlLabel
        control={
          <Switch
            size="small"
            checked={mapManager.visualize}
            onChange={(e) => patch({ visualize: e.target.checked })}
          />
        }
        label="visualize"
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
