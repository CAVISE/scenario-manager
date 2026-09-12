import {
  getEntityItems,
  type EntityItem,
  type EntityKind,
  type SceneEntities,
} from '@/store/utils/sceneEntities';

export type NavigationNode = {
  id: string;
  name: string;
  kind?: EntityKind;
  children?: NavigationNode[];
};

export function buildNavigationTree(state: SceneEntities): NavigationNode[] {
  const items = getEntityItems(state);
  const toNode = (item: EntityItem): NavigationNode => ({
    id: item.id,
    name: item.label,
    kind: item.type,
  });
  const carIds = new Set(state.cars.map((car) => car.id));
  const groups: Array<{ type: EntityKind; name: string }> = [
    { type: 'car', name: 'Vehicles' },
    { type: 'building', name: 'Buildings' },
    { type: 'rsu', name: 'RSUs' },
    { type: 'pedestrian', name: 'Pedestrians' },
    { type: 'point', name: 'Waypoints' },
    { type: 'lidar', name: 'Lidars' },
  ];
  return groups.flatMap(({ type, name }) => {
    const members = items.filter(
      (item) =>
        item.type === type &&
        (!('carId' in item.entity) || !carIds.has(item.entity.carId))
    );
    if (!members.length) return [];
    return [
      {
        id: `group:${type}`,
        name: `${name} (${members.length})`,
        children: members.map((item) => ({
          ...toNode(item),
          ...(type === 'car'
            ? {
                children: items
                  .filter(
                    (child) =>
                      'carId' in child.entity && child.entity.carId === item.id
                  )
                  .map(toNode),
              }
            : {}),
        })),
      },
    ];
  });
}

export function filterNavigationTree(
  nodes: NavigationNode[],
  query: string
): NavigationNode[] {
  const term = query.trim().toLowerCase();
  if (!term) return nodes;
  return nodes.flatMap((node) => {
    if (
      node.name.toLowerCase().includes(term) ||
      node.id.toLowerCase().includes(term)
    )
      return [node];
    const children = filterNavigationTree(node.children ?? [], term);
    return children.length ? [{ ...node, children }] : [];
  });
}

export function getNavigationIds(
  nodes: NavigationNode[],
  entitiesOnly = false
): string[] {
  return nodes.flatMap((node) => [
    ...(!entitiesOnly || node.kind ? [node.id] : []),
    ...getNavigationIds(node.children ?? [], entitiesOnly),
  ]);
}
