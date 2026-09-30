import { beforeEach, describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { resolveSelection } from '@/store/utils/sceneEntities';
import {
  buildNavigationTree,
  filterNavigationTree,
  getNavigationIds,
} from './navigationTree';
import { findObjectInScene } from './sceneUtils';

beforeEach(() =>
  useEditorStore.setState(useEditorStore.getInitialState(), true)
);

describe('scene navigation', () => {
  it('groups readable names and keeps routes and sensors with their vehicle', () => {
    const car = useEditorStore
      .getState()
      .addCar(0, 0, 0, 'technical-model-123', '00ff00');
    const point = useEditorStore.getState().addPoint(car, 2, 3, 0);
    const lidar = useEditorStore.getState().addLidar(car, 0, 0, 1);
    useEditorStore.getState().addBuilding(10, 20, 0);
    const tree = buildNavigationTree(useEditorStore.getState());
    expect(tree.map((group) => group.name)).toEqual([
      'Vehicles (1)',
      'Buildings (1)',
    ]);
    expect(tree[0].children?.[0].name).toBe('Vehicle 01');
    expect(tree[0].children?.[0].children?.map((node) => node.id)).toEqual([
      point,
      lidar,
    ]);
    const filtered = filterNavigationTree(tree, 'waypoint');
    expect(getNavigationIds(filtered, true)).toEqual([car, point]);
    expect(filterNavigationTree(tree, 'not found')).toEqual([]);
  });

  it('resolves multiple entities by store identity and excludes groups and stale IDs', () => {
    const car = useEditorStore.getState().addCar(0, 0, 0, 'car', '00ff00');
    const rsu = useEditorStore.getState().addRSU(2, 3, 0);
    expect(
      resolveSelection(useEditorStore.getState(), [
        'group:car',
        car,
        rsu,
        car,
        'missing',
      ])
    ).toEqual([
      { id: car, type: 'car' },
      { id: rsu, type: 'rsu' },
    ]);
  });

  it('finds the object wrapper instead of its last child mesh', () => {
    const scene = new THREE.Scene();
    const wrapper = new THREE.Group();
    wrapper.userData.id = 'car-1';
    const child = new THREE.Object3D();
    child.userData.id = 'car-1';
    wrapper.add(child);
    scene.add(wrapper);
    expect(
      findObjectInScene({ itemId: 'car-1', sceneRef: { current: scene } })
    ).toBe(wrapper);
  });
});
