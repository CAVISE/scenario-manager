import { Stack } from '@mui/material';

import OpenCDACollapsibleSection from '@sim-config/components/OpenCDACollapsibleSection';
import { RgbTriple } from '../rareComponents/RgbTriple';
import { NumField } from '../rareComponents/NumField';
import type { CoopPerceptionSectionProps } from '../types/opencdaRareTypes';

export const CoopPerceptionSection = ({
  coopPerception,
  patch,
}: CoopPerceptionSectionProps) => (
  <OpenCDACollapsibleSection title="cooperative_perception_visualization">
    <Stack spacing={1}>
      <RgbTriple
        label="background"
        value={coopPerception.background ?? [0, 0, 0]}
        onChange={(v) => patch({ background: v })}
      />
      <NumField
        label="bbox_line_thickness"
        value={coopPerception.bbox_line_thickness ?? 0}
        onChange={(v) => patch({ bbox_line_thickness: v })}
        min={0}
      />
      <NumField
        label="image_dpi"
        value={coopPerception.image_dpi ?? 0}
        onChange={(v) => patch({ image_dpi: v })}
        min={1}
      />
    </Stack>
  </OpenCDACollapsibleSection>
);
