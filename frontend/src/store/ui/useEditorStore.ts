import { create, type StateCreator } from 'zustand';
import { persist, type PersistOptions } from 'zustand/middleware';
import { mergeSimConfigWithDefaults } from '@scenario-export';
import { createHistorySlice } from '../model/slices/createHistorySlice';
import { createSceneSlice } from '../model/slices/createSceneSlice';
import { createSimulationSlice } from '../model/slices/createSimulationSlice';
import type { EditorPersist } from '../types/editorPersistTypes';
import type { EditorState } from '../types/useEditorStoreTypes';

export type {
  Building,
  BuildingMaterial,
  Car,
  CarlaWeather,
  DeletedEntity,
  DeletionSnapshot,
  EditorState,
  ErrorLogEntry,
  HistoryEntry,
  Lidar,
  Point,
  RSU,
  Scenario,
  SimulationPhase,
  SimulationSession,
  V2XProtocol,
} from '../types/useEditorStoreTypes';
export type { SimulationConfig } from '@scenario-export';

const persistOptions: PersistOptions<EditorState, EditorPersist> = {
  name: 'editor-scenario-cache',
  version: 2,
  migrate: (persisted, version) => {
    const state = persisted as Partial<EditorPersist> & {
      selectedId?: string | null;
      selectedObject?: EditorPersist['selectedObjects'][number] | null;
    };
    let next: Partial<EditorPersist> & {
      selectedId?: string | null;
      selectedObject?: EditorPersist['selectedObjects'][number] | null;
    } = { ...state };

    if (version < 2) {
      const { selectedId, selectedObject, ...rest } = next;
      next = {
        ...rest,
        selectedIds: selectedId ? [selectedId] : [],
        selectedObjects: selectedObject ? [selectedObject] : [],
      };
    }

    const simConfig = next.simConfig;
    if (!simConfig?.opencda) return next as EditorPersist;

    return {
      ...next,
      simConfig: {
        ...simConfig,
        opencda: {
          ...simConfig.opencda,
          local_planner: {
            ...simConfig.opencda.local_planner,
            debug: true,
            debug_trajectory: true,
          },
        },
      },
    } as EditorPersist;
  },
  partialize: (state): EditorPersist => ({
    cars: state.cars,
    RSUs: state.RSUs,
    lidars: state.lidars,
    points: state.points,
    buildings: state.buildings,
    Scenario: { ...state.Scenario, file_: null },
    simConfig: state.simConfig,
    selectedIds: state.selectedIds,
    selectedObjects: state.selectedObjects,
    pedestrians: state.pedestrians,
  }),
  merge: (persisted, current) => {
    const state = persisted as Partial<EditorPersist> | undefined;
    return {
      ...current,
      ...state,
      Scenario: { ...current.Scenario, ...state?.Scenario, file_: null },
      simConfig: mergeSimConfigWithDefaults(state?.simConfig),
    };
  },
};

const storeCreator: StateCreator<EditorState> = (...args) => ({
  ...createSceneSlice(...args),
  ...createSimulationSlice(...args),
  ...createHistorySlice(...args),
});

export const useEditorStore = create<EditorState>()(
  persist(storeCreator, persistOptions)
);

if (import.meta.env.DEV && typeof window !== 'undefined') {
  // @ts-expect-error Exposed only as a development console helper.
  window.useEditorStore = useEditorStore;
}
