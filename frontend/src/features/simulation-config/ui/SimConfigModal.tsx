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
        Math.max(minimum ?? Number.NEGATIVE_INFINITY, nextValue)
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
        (Number.isFinite(currentValue) ? currentValue : 0) + step
      );
    };

    const startHolding = (event: Event) => {
      const target = event.target as HTMLElement | null;
      const input = target?.closest(
        'input[type="number"]'
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
        startHolding as EventListener
      );
      container.removeEventListener('mouseleave', stopHolding as EventListener);
      window.removeEventListener('mouseup', stopHolding);
      window.removeEventListener('touchend', stopHolding);
    };
  }, [open]);

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
          alignItems="center"
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
        {tab === 3 && <CarlaTab />}
        {tab === 4 && <OpenCDATab />}
        {tab === 5 && <SumoTab />}
        {tab === 6 && <CapiTab />}
        {tab === 7 && <MpcTab />}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          className="sim-config-modal__actions"
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
