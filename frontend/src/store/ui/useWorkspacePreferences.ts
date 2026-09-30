import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WorkspacePreferences } from '../types/workspacePreferencesTypes';

export const useWorkspacePreferences = create<WorkspacePreferences>()(
  persist(
    (set) => ({
      theme: 'light',
      focusOnSelection: true,
      showSelectionOutline: true,
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
