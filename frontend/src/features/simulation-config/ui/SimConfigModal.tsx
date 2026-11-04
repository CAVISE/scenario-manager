import { useMemo, useRef, useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Divider,
  Stack,
} from '@mui/material';

import type { SimConfigModalProps } from '../types/SimConfigModalTypes';
import {
  ArteryTab,
  CarlaTab,
  CapiTab,
  MpcTab,
  OpenCDATab,
  SionnaTab,
  SumoTab,
  OmnetTab,
} from '../tabs';
import { parseNumberInputChange } from '@/shared/utils/numberInputUtils';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import { useEditorStore } from '@/store';
import { useNumberInputHold } from '../hooks/useNumberInputHold';
import '../styles/SimConfigModal.scss';

export default function SimConfigModal({ open, onClose }: SimConfigModalProps) {
  const [tab, setTab] = useState(0);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig]
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);
  useNumberInputHold(modalContentRef, open);

  return (
    <Modal open={open} onClose={onClose}>
      <Box ref={modalContentRef} className="sim-config-modal">
        <Typography variant="h6" gutterBottom>
          Simulation Settings
        </Typography>

        <Stack
          className="sim-config-modal__summary-row"
          direction="row"
          spacing={2}
          sx={{
            alignItems: 'center',
          }}
        >
          <TextField
            label="Duration (s)"
            type="number"
            size="small"
            value={simConfig.sim_duration}
            onChange={(e) =>
              updateSimConfig({
                sim_duration: parseNumberInputChange(e.target),
              })
            }
            className="sim-config-field--140"
          />
        </Stack>

        <Divider className="sim-config-modal__divider" />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          className="sim-config-modal__tabs"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab className="sim-config-modal__tab" label="OMNeT++" />
          <Tab className="sim-config-modal__tab" label="Artery" />
          <Tab className="sim-config-modal__tab" label="Sionna" />
          <Tab className="sim-config-modal__tab" label="CARLA" />
          <Tab
            className="sim-config-modal__tab sim-config-modal__tab--opencda"
            label="OpenCDA"
          />
          <Tab className="sim-config-modal__tab" label="SUMO" />
          <Tab className="sim-config-modal__tab" label="CAPI" />
          <Tab className="sim-config-modal__tab" label="MPC" />
        </Tabs>

        {tab === 0 && <OmnetTab />}
        {tab === 1 && <ArteryTab />}
        {tab === 2 && <SionnaTab />}
        {tab === 3 && <CarlaTab onMapLoaded={onClose} />}
        {tab === 4 && <OpenCDATab />}
        {tab === 5 && <SumoTab />}
        {tab === 6 && <CapiTab />}
        {tab === 7 && <MpcTab />}

        <Stack
          direction="row"
          className="sim-config-modal__actions"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Stack direction="row" spacing={1} />
          <Button
            onClick={onClose}
            variant="outlined"
            className="sim-config-modal__close"
          >
            Close
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
