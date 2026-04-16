import { useState } from 'react';
import { Modal, Box, Typography, Tabs, Tab, Button, TextField, Divider, Stack} from '@mui/material';

import { useEditorStore } from '../../../../store/useEditorStore';
import { mergeSimConfigWithDefaults } from '../../Generators/types/configGeneratorsTypes';
import { modalBoxSx, type SimConfigModalProps } from './types/SimConfigModalTypes';
import { ArteryTab, CarlaTab, CapiTab, MpcTab, OpenCDATab, SionnaTab, SumoTab, OmnetTab } from './tabs';

export default function SimConfigModal({ open, onClose }: SimConfigModalProps) {
  const [tab, setTab] = useState(0);
  const simConfig              = mergeSimConfigWithDefaults(useEditorStore(s => s.simConfig));
  const updateSimConfig        = useEditorStore(s => s.updateSimConfig);

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalBoxSx}>
        <Typography variant="h6" gutterBottom>Simulation Settings</Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            label="Duration (s)" type="number" size="small"
            value={simConfig.sim_duration}
            onChange={e => updateSimConfig({ sim_duration: Number(e.target.value) })}
            sx={{ width: 140 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
          <Tab label="OMNeT++" />
          <Tab label="Artery" />
          <Tab label="Sionna" />
          <Tab label="CARLA" />
          <Tab label="OpenCDA" sx={{ fontWeight: tab === 4 ? 700 : 400, color: tab === 4 ? 'success.main' : undefined }} />
          <Tab label="SUMO" />
          <Tab label="CAPI" />
          <Tab label="MPC" />
        </Tabs>

        {tab === 0 && (<OmnetTab />)}
        {tab === 1 && (<ArteryTab/>)}
        {tab === 2 && (<SionnaTab />)}
        {tab === 3 && (<CarlaTab />)}
        {tab === 4 && (<OpenCDATab />)}
        {tab === 5 && (<SumoTab />)}
        {tab === 6 && (<CapiTab />)}
        {tab === 7 && (<MpcTab />)}

        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
          <Stack direction="row" spacing={1} />
          <Button onClick={onClose} variant="outlined">Close</Button>
        </Stack>
      </Box>
    </Modal>
  );
}