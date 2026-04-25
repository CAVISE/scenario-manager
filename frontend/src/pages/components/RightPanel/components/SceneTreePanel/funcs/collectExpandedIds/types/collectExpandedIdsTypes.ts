import { SceneNode } from '../../../../../../../Editor/hooks/useEditorEngine/useSceneGraph/types/useSceneGraphTypes';

export interface collectExpandedIdsProps {
  sceneGraph: SceneNode | null;
  setExpandedItems: (value: string[]) => void;
}
