import { SceneNode } from '../../../types/PanelTypes';

export const TYPE_META: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  Car: { icon: '🚗', color: '#2563eb', label: 'CAR' },
  RSU: { icon: '📡', color: '#d97706', label: 'RSU' },
  Building: { icon: '🏢', color: '#7c3aed', label: 'BLD' },
  Lidar: { icon: '⬡', color: '#059669', label: 'LDR' },
  Point: { icon: '◎', color: '#db2777', label: 'WPT' },
  Pedestrian: { icon: '🚶', color: '#0920f0', label: 'HMN' },
};

export function getTypeMeta(name: string) {
  for (const [key, val] of Object.entries(TYPE_META)) {
    if (name.startsWith(key)) return val;
  }
  return { icon: '◇', color: '#6b7280', label: 'OBJ' };
}
export function countNodes(node: SceneNode): number {
  return 1 + (node.children?.reduce((a, c) => a + countNodes(c), 0) ?? 0);
}

export const deleteButtonCss = `
  .stp-node-delete {
    display: none;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: #9ca3af;
    font-size: 10px;
    cursor: pointer;
    border-radius: 3px;
    padding: 0;
    line-height: 1;
    flex-shrink: 0;
  }
  .stp-node-delete:hover {
    background: #fee2e2;
    color: #ef4444;
  }
  .stp-node:hover .stp-node-delete {
    display: flex;
  }
  .stp-clear-btn {
    margin-left: auto;
    font-size: 10px;
    color: #ef4444;
    background: transparent;
    border: 1px solid #fca5a5;
    border-radius: 4px;
    padding: 2px 7px;
    cursor: pointer;
    font-weight: 500;
  }
  .stp-clear-btn:hover {
    background: #fee2e2;
  }
`;
