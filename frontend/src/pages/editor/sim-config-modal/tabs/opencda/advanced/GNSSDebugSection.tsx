import { Stack } from '@mui/material';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import { NumField } from '../fields/NumField';
import type { GnssDebugSectionProps } from '../opencda.types';

export const GNSSDebugSection = ({
  oc,
  patchGnss,
  update,
}: GnssDebugSectionProps) => (
  <OpenCDACollapsibleSection title="GNSS & localization debug">
    <Stack spacing={1}>
      <NumField
        label="heading_direction_stddev"
        value={oc.gnss_noise?.heading_direction_stddev ?? 0}
        onChange={(v) => patchGnss({ heading_direction_stddev: v })}
        step={0.01}
        min={0}
      />
      <NumField
        label="speed_stddev"
        value={oc.gnss_noise?.speed_stddev ?? 0}
        onChange={(v) => patchGnss({ speed_stddev: v })}
        step={0.01}
        min={0}
      />
      <NumField
        label="debug_helper.x_scale"
        value={oc.localization_debug_x_scale ?? 0}
        onChange={(v) => update({ localization_debug_x_scale: v })}
        min={0}
      />
      <NumField
        label="debug_helper.y_scale"
        value={oc.localization_debug_y_scale ?? 0}
        onChange={(v) => update({ localization_debug_y_scale: v })}
        min={0}
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
