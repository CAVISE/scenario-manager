import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspacePreferences } from '../types/workspacePreferencesTypes';

export const useWorkspacePreferences = create<WorkspacePreferences>()(
  persist(
    (set) => ({
      theme: 'light',
      focusOnSelection: true,
      showSelectionOutline: true,
      showGrid: true,
      showRoutes: true,
      showLidarCoverage: true,
      snapToGrid: false,
      snapToRoad: false,
      gridSnapStep: 0.5,
      snapRotation: false,
      rotationSnapDegrees: 15,
      duplicateOffset: 2,
      alignVehiclesToRoute: false,
      reduceVisualLoad: false,
      compactEditor: false,
      sceneGraphOpen: true,
      rightPanelCollapsed: false,
      scenePanelWidth: 258,
      contextPanelWidth: 332,
      recentScenarioIds: [],
      update: (patch) => set(patch),
      recordOpened: (id) =>
        set((state) => ({
          recentScenarioIds: [
            id,
            ...state.recentScenarioIds.filter((other) => other !== id),
          ].slice(0, 12),
        })),
    }),
    { name: 'scenario-manager-preferences', version: 1 }
  )
);
