import { SceneNode } from '@editor/hooks/useEditorEngine/useSceneGraph/types/useSceneGraphTypes';

export interface collectExpandedIdsProps {
  sceneGraph: SceneNode | null;
  setExpandedItems: (value: string[]) => void;
}
