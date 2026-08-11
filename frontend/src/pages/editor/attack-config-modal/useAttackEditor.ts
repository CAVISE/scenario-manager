import { useMemo, useState } from 'react';
import { nanoid } from 'nanoid';
import {
  mergeSimConfigWithDefaults,
  normalizeAttackStages,
  type OpenCDAAttackConfig,
  type OpenCDAAttackStage,
} from '../generators/generators.types';
import {
  GNSS_DRIFT_PARAMS,
  GNSS_SPOOFER_PRESET,
} from './AttackConfigModal.types';
import { useEditorStore } from '../../../store';

export function useAttackEditor() {
  const rawSimConfig = useEditorStore((s) => s.simConfig);
  const simConfig = useMemo(
    () => mergeSimConfigWithDefaults(rawSimConfig),
    [rawSimConfig],
  );
  const updateSimConfig = useEditorStore((s) => s.updateSimConfig);
  const attacks = useMemo(() => simConfig.attacks ?? [], [simConfig.attacks]);
  const [selectedAttack, setSelectedAttack] = useState(0);

  const currentAttack = useMemo(
    () => attacks[selectedAttack] ?? null,
    [attacks, selectedAttack],
  );

  const updateAttackAt = (
    index: number,
    patch: Partial<OpenCDAAttackConfig>,
  ) => {
    const nextAttacks = [...attacks];
    const existing = nextAttacks[index] ?? {};
    const stages = patch.stages
      ? normalizeAttackStages(patch.stages)
      : normalizeAttackStages(existing.stages);
    nextAttacks[index] = { ...existing, ...patch, stages };
    updateSimConfig({ attacks: nextAttacks });
  };

  const updateStageAt = (stageIndex: number, stage: OpenCDAAttackStage) => {
    if (!currentAttack) return;
    const stages = [...(currentAttack.stages ?? [])];
    stages[stageIndex] = stage;
    updateAttackAt(selectedAttack, { stages });
  };

  const addStage = () => {
    if (!currentAttack) return;
    const stages = [...(currentAttack.stages ?? [])];
    stages.push({
      id: nanoid(6),
      type: 'spoofer',
      params: { ...GNSS_DRIFT_PARAMS },
    });
    updateAttackAt(selectedAttack, { stages });
  };

  const removeStage = (stageIndex: number) => {
    if (!currentAttack) return;
    const stages = [...(currentAttack.stages ?? [])];
    stages.splice(stageIndex, 1);
    updateAttackAt(selectedAttack, { stages });
  };

  const addAttack = () => {
    const defaultAttack = {
      name: `attack_${Date.now()}`,
      requirements: {},
      start_trigger: {},
      stop_trigger: {},
      targets: {},
      stages: [],
    };
    const nextAttacks = [...attacks, defaultAttack];
    updateSimConfig({
      attacks: nextAttacks,
      opencda: { ...simConfig.opencda, export_attacks: true },
    });
    setSelectedAttack(nextAttacks.length - 1);
  };

  const addGnssSpoofer = () => {
    const presetAttack = {
      ...GNSS_SPOOFER_PRESET,
      name: `gnss_spoof_${attacks.length + 1}`,
      stages: GNSS_SPOOFER_PRESET.stages.map((stage) => ({
        ...stage,
        id: nanoid(6),
        params: { ...GNSS_DRIFT_PARAMS },
      })),
    };
    const nextAttacks = [...attacks, presetAttack];
    updateSimConfig({
      attacks: nextAttacks,
      opencda: { ...simConfig.opencda, export_attacks: true },
    });
    setSelectedAttack(nextAttacks.length - 1);
  };

  const removeCurrentAttack = () => {
    if (!currentAttack) return;
    const nextAttacks = attacks.filter((_, idx) => idx !== selectedAttack);
    updateSimConfig({ attacks: nextAttacks });
    setSelectedAttack(Math.max(0, selectedAttack - 1));
  };

  return {
    attacks,
    selectedAttack,
    setSelectedAttack,
    currentAttack,
    updateAttackAt,
    updateStageAt,
    addStage,
    removeStage,
    addAttack,
    addGnssSpoofer,
    removeCurrentAttack,
  };
}
