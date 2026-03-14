import { Button, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  Stack, FormControl, FormLabel, Input, Grid, Divider, Typography,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/joy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useEditorStore } from '../../../../../store/useEditorStore';
import { numInputSlot } from '../types/PanelTypes';
import type { RSUPropertiesProps} from './types/RSUPropertiesTypes'


export default function RSUProperties({ rsu, onDelete }: RSUPropertiesProps) {
  const updateRSU = useEditorStore(s => s.updateRSU);

  return (
    <Stack spacing={2}>
      <Typography level="title-sm">RSU Object</Typography>

      <FormLabel>Position</FormLabel>
      <Grid container spacing={1}>
        {(['x', 'y', 'z'] as const).map(axis => (
          <Grid xs={4} key={axis}>
            <FormControl>
              <FormLabel sx={{ fontSize: 'xs', mb: 0.5 }}>{axis.toUpperCase()}</FormLabel>
              <Input
                size="sm" type="number"
                slotProps={numInputSlot}
                value={rsu[axis].toFixed(3)}
                onChange={e => updateRSU(rsu.id, { [axis]: parseFloat(e.target.value) })}
              />
            </FormControl>
          </Grid>
        ))}
      </Grid>

      <Divider />
      <Typography level="title-sm" sx={{ color: 'text.secondary' }}>V2X Parameters</Typography>

      <Grid container spacing={1}>
        <Grid xs={6}>
          <FormControl>
            <FormLabel>TX Power (mW)</FormLabel>
            <Input
              size="sm" type="number"
              slotProps={numInputSlot}
              value={rsu.tx_power ?? 20}
              onChange={e => updateRSU(rsu.id, { tx_power: parseFloat(e.target.value) })}
            />
          </FormControl>
        </Grid>
        <Grid xs={6}>
          <FormControl>
            <FormLabel>Range (m)</FormLabel>
            <Input
              size="sm" type="number"
              slotProps={numInputSlot}
              value={rsu.range ?? 500}
              onChange={e => updateRSU(rsu.id, { range: parseFloat(e.target.value) })}
            />
          </FormControl>
        </Grid>
      </Grid>

      <FormControl>
        <FormLabel>Frequency (Hz)</FormLabel>
        <Input
          size="sm" type="number"
          slotProps={numInputSlot}
          value={rsu.frequency ?? 5.9e9}
          onChange={e => updateRSU(rsu.id, { frequency: parseFloat(e.target.value) })}
        />
      </FormControl>

      <FormControl onClick={e => e.stopPropagation()}>
        <FormLabel>Protocol</FormLabel>
        <ToggleButtonGroup
          exclusive
          value={rsu.protocol ?? 'DSRC'}
          onChange={(_, val) => {
            if (val) updateRSU(rsu.id, { protocol: val as 'DSRC' | 'C-V2X' });
          }}
          size="small" fullWidth
        >
          {(['DSRC', 'C-V2X'] as const).map(proto => (
            <ToggleButton key={proto} value={proto} sx={{ flex: 1 }}>
              {proto}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </FormControl>

      <Accordion>
        <AccordionSummary indicator={<KeyboardArrowDownIcon />}>
          <Typography level="title-sm">Script</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormControl>
            <textarea
              rows={8}
              style={{
                width: '100%', fontFamily: 'monospace', fontSize: 12,
                padding: 8, borderRadius: 4, border: '1px solid #ccc',
                resize: 'vertical', boxSizing: 'border-box',
                backgroundColor: '#1e1e1e', color: '#d4d4d4',
              }}
              placeholder="// RSU script..."
              value={rsu.script ?? ''}
              onKeyDown={e => e.stopPropagation()}
              onChange={e => updateRSU(rsu.id, { script: e.target.value })}
            />
          </FormControl>
        </AccordionDetails>
      </Accordion>

      <Button color="error" variant="outlined" onClick={onDelete}>
        Delete RSU
      </Button>
    </Stack>
  );
}