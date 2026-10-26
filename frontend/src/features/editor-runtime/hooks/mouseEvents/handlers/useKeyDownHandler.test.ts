import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { useKeyDownHandler } from './useKeyDownHandler';

const mocks = vi.hoisted(() => ({
  refs: {} as Record<string, unknown>,
  updateSceneGraph: vi.fn(),
}));
vi.mock('@editor/context', () => ({
  useEditorRefs: () => mocks.refs,
  useHooks: () => ({ updateSceneGraph: mocks.updateSceneGraph }),
}));

const toast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  undo: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  useEditorStore.setState(useEditorStore.getInitialState(), true);
});

describe('waypoint keyboard deletion', () => {
  it('deletes a waypoint of the second vehicle and can restore it', () => {
    const scene = new THREE.Scene();
    const cars = [0, 10].map((x) => {
      const id = useEditorStore.getState().addCar(x, 0, 0, 'car', '2563eb');
      const mesh = new THREE.Group();
      mesh.userData = { id, type: 'car' };
      return mesh;
    });
    const routePointMeshes = cars.map((car) => {
      const id = useEditorStore.getState().addPoint(car.userData.id, 1, 2, 0);
      const routePointMesh = new THREE.Mesh();
      routePointMesh.userData = { id, type: 'route-point' };
      scene.add(routePointMesh);
      return [routePointMesh];
    });
    const firstPointId = routePointMeshes[0][0].userData.id;
    const selected = routePointMeshes[1][0];
    const selectedPointId = selected.userData.id;
    useEditorStore
      .getState()
      .selectObjects([{ id: selectedPointId, type: 'point' }]);
    // Fail promptly if the loop stops advancing to the second vehicle.
    const firstGroup = routePointMeshes[0];
    let firstGroupReads = 0;
    Object.defineProperty(routePointMeshes, 0, {
      get: () => {
        if (++firstGroupReads > 1)
          throw new Error('Waypoint loop did not advance');
        return firstGroup;
      },
    });
    mocks.refs = {
      sceneRef: { current: scene },
      carMeshesRef: { current: cars },
      transformControlsRef: { current: { object: selected, detach: vi.fn() } },
      rsuRenderMeshesRef: { current: [] },
      rsuObjectMeshesRef: { current: [] },
      rsuMeshesRef: { current: [] },
      routePointMeshesRef: { current: routePointMeshes },
      modeRef: { current: {} },
    };

    const { result } = renderHook(() => useKeyDownHandler({ toast }));
    act(() => result.current(new KeyboardEvent('keydown', { key: 'Delete' })));

    expect(useEditorStore.getState().points.map((point) => point.id)).toEqual([
      firstPointId,
    ]);
    expect(scene.children).not.toContain(selected);
    expect(toast.undo).toHaveBeenCalledOnce();
    act(() => toast.undo.mock.calls[0][1]());
    expect(useEditorStore.getState().points.map((point) => point.id)).toEqual([
      firstPointId,
      selectedPointId,
    ]);
  });

  it('deletes an RSU root instead of walking up to the scene', () => {
    const scene = new THREE.Scene();
    const rsuId = useEditorStore.getState().addRSU(10, 20, 30);
    const rsu = new THREE.Group();
    rsu.userData = { id: rsuId, type: 'rsu' };
    rsu.add(
      new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    );
    scene.add(rsu);
    mocks.refs = {
      sceneRef: { current: scene },
      carMeshesRef: { current: [] },
      transformControlsRef: { current: { object: rsu, detach: vi.fn() } },
      rsuRenderMeshesRef: { current: [rsu] },
      rsuObjectMeshesRef: { current: [rsu] },
      rsuMeshesRef: { current: [rsu] },
      routePointMeshesRef: { current: [] },
      modeRef: { current: {} },
    };

    const { result } = renderHook(() => useKeyDownHandler({ toast }));
    act(() => result.current(new KeyboardEvent('keydown', { key: 'Delete' })));

    expect(useEditorStore.getState().RSUs).toEqual([]);
    expect(scene.children).not.toContain(rsu);
    expect(mocks.refs.rsuRenderMeshesRef).toMatchObject({ current: [] });
    expect(useEditorStore.getState().canRedo()).toBe(false);

    expect(useEditorStore.getState().undo()).toBe(true);
    expect(useEditorStore.getState().RSUs).toHaveLength(1);
    expect(useEditorStore.getState().canRedo()).toBe(true);

    expect(useEditorStore.getState().redo()).toBe(true);
    expect(useEditorStore.getState().RSUs).toEqual([]);
  });
});
