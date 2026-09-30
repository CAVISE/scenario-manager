import { nanoid } from 'nanoid';
import type { StateCreator } from 'zustand';
import { defaultSimConfig, mergeSimConfigWithDefaults } from '@scenario-export';
import type {
  EditorState,
  SimulationSession,
} from '../../types/useEditorStoreTypes';

const MAX_ERROR_LOG_SIZE = 300;

const initialSimulationSession: SimulationSession = {
  phase: 'idle',
  runId: null,
  status: null,
  error: null,
  startedAt: null,
};

type SimulationSlice = Pick<
  EditorState,
  | 'error'
  | 'simulationSession'
  | 'simConfig'
  | 'Scenario'
  | 'isPanelOpen'
  | 'errorLog'
  | 'sceneExplicitlyCleared'
  | 'setError'
  | 'logError'
  | 'clearErrorLog'
  | 'updateSimulationSession'
  | 'resetSimulationSession'
  | 'updateSimConfig'
  | 'updateSimConfigOmnet'
  | 'updateSimConfigArtery'
  | 'updateSimConfigSionna'
  | 'updateSimConfigCarla'
  | 'updateSimConfigCAPI'
  | 'updateSimConfigOpenCDA'
  | 'updateSimConfigSumo'
  | 'updateSimConfigMPC'
  | 'updateScenario'
  | 'setChangePanelMode'
  | 'setSceneExplicitlyCleared'
>;

export const createSimulationSlice: StateCreator<
  EditorState,
  [],
  [],
  SimulationSlice
> = (set, get) => ({
  error: null,
  simulationSession: initialSimulationSession,
  simConfig: defaultSimConfig,
  isPanelOpen: true,
  errorLog: [],
  Scenario: {
    id: Date.now().toString(),
    name: 'Default Scenario',
    weather: 'ClearNoon',
    description: '',
    file_: null,
  },
  sceneExplicitlyCleared: false,

  updateScenario: (props) =>
    set((state) => ({ Scenario: { ...state.Scenario, ...props } })),
  setSceneExplicitlyCleared: (value) => set({ sceneExplicitlyCleared: value }),
  updateSimConfig: (props) =>
    set((state) => ({
      simConfig: { ...mergeSimConfigWithDefaults(state.simConfig), ...props },
    })),
  setError: (error) => {
    set({ error });
    if (error) {
      get().logError({
        message: error.message,
        stack: error.stack,
        source: 'react-boundary',
      });
    }
  },
  logError: (entry) =>
    set((state) => {
      const now = Date.now();
      const last = state.errorLog[state.errorLog.length - 1];
      if (
        last &&
        last.message === entry.message &&
        last.source === entry.source &&
        now - last.timestamp < 100
      ) {
        return {};
      }
      const next = [
        ...state.errorLog,
        { ...entry, id: nanoid(), timestamp: now },
      ];
      const overflow = next.length - MAX_ERROR_LOG_SIZE;
      return { errorLog: overflow > 0 ? next.slice(overflow) : next };
    }),
  clearErrorLog: () => set({ errorLog: [] }),
  updateSimulationSession: (patch) =>
    set((state) => ({
      simulationSession: { ...state.simulationSession, ...patch },
    })),
  resetSimulationSession: () =>
    set({ simulationSession: { ...initialSimulationSession } }),
  setChangePanelMode: () =>
    set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  updateSimConfigOmnet: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, omnet: { ...simConfig.omnet, ...props } },
      };
    }),
  updateSimConfigArtery: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, artery: { ...simConfig.artery, ...props } },
      };
    }),
  updateSimConfigSionna: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, sionna: { ...simConfig.sionna, ...props } },
      };
    }),
  updateSimConfigMPC: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, mpc: { ...simConfig.mpc, ...props } },
      };
    }),
  updateSimConfigCarla: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, carla: { ...simConfig.carla, ...props } },
      };
    }),
  updateSimConfigCAPI: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, capi: { ...simConfig.capi, ...props } },
      };
    }),
  updateSimConfigOpenCDA: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: {
          ...simConfig,
          opencda: { ...simConfig.opencda, ...props },
        },
      };
    }),
  updateSimConfigSumo: (props) =>
    set((state) => {
      const simConfig = mergeSimConfigWithDefaults(state.simConfig);
      return {
        simConfig: { ...simConfig, sumo: { ...simConfig.sumo, ...props } },
      };
    }),
});
