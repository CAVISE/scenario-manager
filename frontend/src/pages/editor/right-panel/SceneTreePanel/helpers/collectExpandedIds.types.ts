import { SceneNode } from '../../../hooks/useSceneGraph.types';

export interface collectExpandedIdsProps {
  sceneGraph: SceneNode | null;
  setExpandedItems: (value: string[]) => void;
}
