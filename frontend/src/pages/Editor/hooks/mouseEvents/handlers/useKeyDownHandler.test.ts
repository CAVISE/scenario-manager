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
    const circles = cars.map((car) => {
      const id = useEditorStore.getState().addPoint(car.userData.id, 1, 2, 0);
      const circle = new THREE.Mesh();
      circle.userData = { id, type: 'circle' };
      scene.add(circle);
      return [circle];
    });
    const firstPointId = circles[0][0].userData.id;
    const selected = circles[1][0];
    const selectedPointId = selected.userData.id;
    useEditorStore
      .getState()
      .selectObjects([{ id: selectedPointId, type: 'point' }]);
    // Fail promptly if the loop stops advancing to the second vehicle.
    const firstGroup = circles[0];
    let firstGroupReads = 0;
    Object.defineProperty(circles, 0, {
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
      pointsArrRef: { current: [] },
      pointsObjsRef: { current: [] },
      rsuMeshesRef: { current: [] },
      cubeCirclesRef: { current: circles },
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
});
