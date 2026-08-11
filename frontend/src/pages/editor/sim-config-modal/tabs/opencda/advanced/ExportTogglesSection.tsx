import { FormControlLabel, Stack, Switch } from '@mui/material';
import OpenCDACollapsibleSection from '../../../OpenCDACollapsibleSection';
import type { OpenCDASectionProps } from '../opencda.types';
import { OPEN_CDA_EXPORT_TOGGLES } from '../opencda.constants';

export const ExportTogglesSection = ({ oc, update }: OpenCDASectionProps) => (
  <OpenCDACollapsibleSection title="Export toggles">
    <Stack spacing={0.5}>
      {OPEN_CDA_EXPORT_TOGGLES.map(([key, label]) => (
        <FormControlLabel
          key={key}
          control={
            <Switch
              size="small"
              checked={oc[key]}
              onChange={(e) => update({ [key]: e.target.checked })}
            />
          }
          label={label}
        />
      ))}
    </Stack>
  </OpenCDACollapsibleSection>
);
