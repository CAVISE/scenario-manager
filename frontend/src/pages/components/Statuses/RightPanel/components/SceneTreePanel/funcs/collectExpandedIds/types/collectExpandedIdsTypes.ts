import { SceneNode } from "../../../../../../../../Editor/hooks/types/useSceneGraphTypes";

export interface collectExpandedIdsProps {
  sceneGraph: SceneNode | null;
  setExpandedItems: (value: string[])=> void
}