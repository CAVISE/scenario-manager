import { SceneNode } from "../../../../../../../Editor/hooks/types/useSceneGraphTypes";
import { collectExpandedIdsProps } from "./types/collectExpandedIdsTypes";
export function collectExpandedIds({sceneGraph, setExpandedItems}: collectExpandedIdsProps){
  if (!sceneGraph) return;
  const ids: string[] = [];
    const collect = (node: SceneNode) => {
      if (node.children?.length) {
        ids.push(node.id);
        node.children.forEach(collect);
      }
    };
  collect(sceneGraph);
  setExpandedItems(ids);
}