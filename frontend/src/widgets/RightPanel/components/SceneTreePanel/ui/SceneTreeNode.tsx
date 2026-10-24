import { TreeItem } from '@mui/x-tree-view/TreeItem';
import { ENTITY_TYPE_KEYS, TYPE_META } from '../constants/sceneTreeConstants';
import type { NavigationNode } from '../types/SceneTreePanelTypes';

type SceneTreeNodeProps = {
  node: NavigationNode;
  onHover: (node: NavigationNode) => void;
  onLeave: () => void;
};

export const SceneTreeNode = ({
  node,
  onHover,
  onLeave,
}: SceneTreeNodeProps) => {
  const meta = node.kind ? TYPE_META[ENTITY_TYPE_KEYS[node.kind]] : null;
  return (
    <TreeItem
      itemId={node.id}
      label={
        <div
          className="stp-node"
          data-scene-id={node.id}
          onMouseEnter={() => onHover(node)}
          onMouseLeave={onLeave}
        >
          <span className="stp-node-icon" aria-hidden="true">
            {meta?.icon ?? '▤'}
          </span>
          <span className="stp-node-name">{node.name}</span>
          {meta && (
            <span
              className={`stp-node-badge stp-node-badge--${meta.label.toLowerCase()}`}
            >
              {meta.label}
            </span>
          )}
        </div>
      }
    >
      {node.children?.map((child) => (
        <SceneTreeNode
          key={child.id}
          node={child}
          onHover={onHover}
          onLeave={onLeave}
        />
      ))}
    </TreeItem>
  );
};
