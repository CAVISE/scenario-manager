import type { WorkspacePreferences } from '@/store/types/workspacePreferencesTypes';

type EditorVisual = 'grid' | 'routes' | 'lidarCoverage';

const preferenceByVisual: Record<
  EditorVisual,
  'showGrid' | 'showRoutes' | 'showLidarCoverage'
> = {
  grid: 'showGrid',
  routes: 'showRoutes',
  lidarCoverage: 'showLidarCoverage',
};

export function isEditorVisualVisible(
  preferences: Pick<
    WorkspacePreferences,
    'showGrid' | 'showRoutes' | 'showLidarCoverage' | 'reduceVisualLoad'
  >,
  visual: EditorVisual
) {
  return (
    !preferences.reduceVisualLoad && preferences[preferenceByVisual[visual]]
  );
}
