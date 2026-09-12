import { useEditorStore } from '../../../../../../store';

export const useMpcConfig = () => {
  const mpc = useEditorStore((s) => s.simConfig.mpc);
  const updateSimConfigMPC = useEditorStore((s) => s.updateSimConfigMPC);

  return { mpc, updateSimConfigMPC };
};
