import { useEffect, type MutableRefObject } from 'react';
import type * as THREE from 'three';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { invalidateEditorScene } from '@editor/lib/invalidateEditorScene';
import { isEditorVisualVisible } from '@editor/lib/visualPreferences';
import type { OdrMapMeshes } from '@editor/hooks/useOpenDriveUtils/useOdrMap/types/useOdrMapTypes';

type Props = {
  ready: boolean;
  sceneRef: MutableRefObject<THREE.Scene | undefined>;
  getOdrMeshes: () => OdrMapMeshes;
};

export function useEditorVisualPreferences({
  ready,
  sceneRef,
  getOdrMeshes,
}: Props) {
  const showGrid = useWorkspacePreferences((state) => state.showGrid);
  const showRoutes = useWorkspacePreferences((state) => state.showRoutes);
  const showLidarCoverage = useWorkspacePreferences(
    (state) => state.showLidarCoverage
  );
  const reduceVisualLoad = useWorkspacePreferences(
    (state) => state.reduceVisualLoad
  );

  useEffect(() => {
    if (!ready) return;

    const scene = sceneRef.current;
    const meshes = getOdrMeshes();
    const preferences = {
      showGrid,
      showRoutes,
      showLidarCoverage,
      reduceVisualLoad,
    };
    if (meshes.ground_grid)
      meshes.ground_grid.visible = isEditorVisualVisible(preferences, 'grid');
    scene?.traverse((object) => {
      if (
        object.userData.type === 'route-point' ||
        object.name === 'route-connection'
      ) {
        object.visible = isEditorVisualVisible(preferences, 'routes');
      }
      if (
        object.name === 'Lidar coverage volume' ||
        object.name.startsWith('Lidar range ring')
      ) {
        object.visible = isEditorVisualVisible(preferences, 'lidarCoverage');
      }
    });
    invalidateEditorScene();
  }, [
    getOdrMeshes,
    ready,
    reduceVisualLoad,
    sceneRef,
    showGrid,
    showLidarCoverage,
    showRoutes,
  ]);
}
