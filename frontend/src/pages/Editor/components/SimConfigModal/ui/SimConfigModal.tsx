import { useEffect, useMemo, useRef, useState } from 'react';
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

import { useEditorStore } from '../../../../../store';
import { mergeSimConfigWithDefaults } from '../../../Generators/types/configGeneratorsTypes';
import { muiPressableRootStyle } from '../../../../../theme/pressInteraction';
import { useModalOpenTracking } from '../../../hooks/useModalOpenTracking';
import {
  modalBoxSx,
  type SimConfigModalProps,
} from '../types/SimConfigModalTypes';
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
import { parseNumberInputChange } from '../utils/numberInputUtils';

export default function SimConfigModal({ open, onClose }: SimConfigModalProps) {
  useModalOpenTracking(open);
  const [tab, setTab] = useState(0);
  const modalContentRef = useRef<HTMLDivElement | null>(null);
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig],
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);

  useEffect(() => {
    const container = modalContentRef.current;

    if (!open || !container) {
      return undefined;
    }

    const HOLD_DELAY_MS = 350;
    const HOLD_REPEAT_MS = 90;

    let activeInput: HTMLInputElement | null = null;
    let holdDelayTimeout: number | null = null;
    let holdInterval: number | null = null;
    let step = 1;
    let minimum: number | undefined;
    let maximum: number | undefined;

    const clearHoldTimers = () => {
      if (holdDelayTimeout !== null) {
        window.clearTimeout(holdDelayTimeout);
        holdDelayTimeout = null;
      }
      if (holdInterval !== null) {
        window.clearInterval(holdInterval);
        holdInterval = null;
      }
    };

    const stopHolding = () => {
      clearHoldTimers();
      activeInput = null;
    };

    const updateInputValue = (nextValue: number) => {
      if (!activeInput) {
        return;
      }

      const clampedValue = Math.min(
        maximum ?? Number.POSITIVE_INFINITY,
        Math.max(minimum ?? Number.NEGATIVE_INFINITY, nextValue),
      );

      activeInput.value = String(clampedValue);
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));
      activeInput.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const stepInput = () => {
      if (!activeInput) {
        return;
      }
      const currentValue = Number(activeInput.value);
      updateInputValue(
        (Number.isFinite(currentValue) ? currentValue : 0) + step,
      );
    };

    const startHolding = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const input = target?.closest(
        'input[type="number"]',
      ) as HTMLInputElement | null;

      if (!input) {
        return;
      }

      stopHolding();
      activeInput = input;
      minimum = input.min ? Number(input.min) : undefined;
      maximum = input.max ? Number(input.max) : undefined;
      step = Number(input.step || 1);
      step = Number.isFinite(step) && step > 0 ? step : 1;

      holdDelayTimeout = window.setTimeout(() => {
        holdDelayTimeout = null;
        if (!activeInput) {
          return;
        }
        stepInput();
        holdInterval = window.setInterval(stepInput, HOLD_REPEAT_MS);
      }, HOLD_DELAY_MS);
    };

    container.addEventListener('mousedown', startHolding as EventListener);
    container.addEventListener('touchstart', startHolding as EventListener);
    container.addEventListener('mouseleave', stopHolding as EventListener);
    window.addEventListener('mouseup', stopHolding);
    window.addEventListener('touchend', stopHolding);

    return () => {
      stopHolding();
      container.removeEventListener('mousedown', startHolding as EventListener);
      container.removeEventListener(
        'touchstart',
        startHolding as EventListener,
      );
      container.removeEventListener('mouseleave', stopHolding as EventListener);
      window.removeEventListener('mouseup', stopHolding);
      window.removeEventListener('touchend', stopHolding);
    };
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <Box ref={modalContentRef} sx={modalBoxSx}>
        <Typography variant="h6" gutterBottom>
          Simulation Settings
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
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
            sx={{ width: 140 }}
          />
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          sx={{ mb: 2 }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="OMNeT++" sx={muiPressableRootStyle} />
          <Tab label="Artery" sx={muiPressableRootStyle} />
          <Tab label="Sionna" sx={muiPressableRootStyle} />
          <Tab label="CARLA" sx={muiPressableRootStyle} />
          <Tab
            label="OpenCDA"
            sx={{
              ...muiPressableRootStyle,
              fontWeight: tab === 4 ? 700 : 400,
              color: tab === 4 ? 'success.main' : undefined,
            }}
          />
          <Tab label="SUMO" sx={muiPressableRootStyle} />
          <Tab label="CAPI" sx={muiPressableRootStyle} />
          <Tab label="MPC" sx={muiPressableRootStyle} />
        </Tabs>

        {tab === 0 && <OmnetTab />}
        {tab === 1 && <ArteryTab />}
        {tab === 2 && <SionnaTab />}
        {tab === 3 && <CarlaTab />}
        {tab === 4 && <OpenCDATab />}
        {tab === 5 && <SumoTab />}
        {tab === 6 && <CapiTab />}
        {tab === 7 && <MpcTab />}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          sx={{ mt: 3 }}
        >
          <Stack direction="row" spacing={1} />
          <Button
            onClick={onClose}
            variant="outlined"
            sx={muiPressableRootStyle}
          >
            Close
          </Button>
        </Stack>
      </Box>
    </Modal>
  );
}
