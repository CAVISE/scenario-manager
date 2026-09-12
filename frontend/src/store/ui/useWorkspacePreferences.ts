import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Preferences = {
  theme: 'light' | 'dark' | 'system';
  focusOnSelection: boolean;
  showSelectionOutline: boolean;
  recentScenarioIds: string[];
  update: (
    patch: Partial<
      Pick<Preferences, 'theme' | 'focusOnSelection' | 'showSelectionOutline'>
    >
  ) => void;
  recordOpened: (id: string) => void;
};

export const useWorkspacePreferences = create<Preferences>()(
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
