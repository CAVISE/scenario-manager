import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useClickHandler } from './useClickHandler';

const mocks = vi.hoisted(() => ({
  refs: {} as Record<string, unknown>,
  attach: vi.fn(),
  detach: vi.fn(),
  intersect: vi.fn(),
}));
vi.mock('@editor/context', () => ({ useEditorRefs: () => mocks.refs }));
let objects: THREE.Object3D[];
const modes = {
  isAddCarModeActive: false,
  isAddPointModeActive: false,
  isAddPedestrianModeActive: false,
  isAddedPoints: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  useEditorStore.setState(useEditorStore.getInitialState(), true);
  const scene = new THREE.Scene();
  objects = [0, 1].map((x) => {
    const id = useEditorStore.getState().addCar(x, 0, 0, 'car', '00ff00');
    const wrapper = new THREE.Group();
    wrapper.userData = { id, type: 'car' };
    scene.add(wrapper);
    return wrapper;
  });
  useEditorStore.getState().clearSelection();
  Object.assign(modes, {
    isAddCarModeActive: false,
    isAddPointModeActive: false,
    isAddPedestrianModeActive: false,
    isAddedPoints: false,
  });
  mocks.refs = {
    sceneRef: { current: scene },
    cameraRef: { current: new THREE.PerspectiveCamera() },
    roadMeshRef: { current: new THREE.Object3D() },
    transformControlsRef: {
      current: { attach: mocks.attach, detach: mocks.detach },
    },
    carMeshesRef: { current: objects },
    cubeCirclesRef: { current: [] },
    rsuMeshesRef: { current: [] },
    pedestrianMeshesRef: { current: [] },
    modeRef: { current: modes },
    currentCarRef: { current: 'car' },
    currentColorRef: { current: '00ff00' },
  };
  mocks.intersect.mockReturnValue([]);
});

const context = () =>
  ({
    insideEditorCanvas: () => true,
    setMouse: vi.fn(),
    mouse: new THREE.Vector2(),
    raycaster: { setFromCamera: vi.fn(), intersectObjects: mocks.intersect },
  }) as unknown as SharedMouseContext;

describe('3D selection', () => {
  it('toggles a complete multi-selection with Shift/Ctrl and detaches the single-object gizmo', () => {
    const { result } = renderHook(() => useClickHandler(context()));
    mocks.intersect.mockReturnValue([{ object: objects[0] }]);
    act(() => result.current(new MouseEvent('click')));
    mocks.intersect.mockReturnValue([{ object: objects[1] }]);
    mocks.attach.mockClear();
    act(() => result.current(new MouseEvent('click', { shiftKey: true })));
    expect(useEditorStore.getState().selectedIds).toEqual(
      objects.map((object) => object.userData.id)
    );
    expect(mocks.attach).not.toHaveBeenCalled();
    act(() => result.current(new MouseEvent('click', { ctrlKey: true })));
    expect(useEditorStore.getState().selectedIds).toEqual([
      objects[0].userData.id,
    ]);
  });

  it('keeps the selected vehicle while clicking to place waypoints', () => {
    useEditorStore
      .getState()
      .selectObjects([{ id: objects[0].userData.id, type: 'car' }]);
    modes.isAddedPoints = true;
    const { result } = renderHook(() => useClickHandler(context()));
    act(() => result.current(new MouseEvent('click')));
    expect(useEditorStore.getState().selectedIds).toEqual([
      objects[0].userData.id,
    ]);
    expect(mocks.detach).not.toHaveBeenCalled();
  });

  it('allows inspection during a run without attaching transforms or adding vehicles', () => {
    modes.isAddCarModeActive = true;
    useEditorStore.getState().updateSimulationSession({ phase: 'running' });
    const { result } = renderHook(() => useClickHandler(context()));
    mocks.intersect.mockReturnValue([{ object: objects[1] }]);
    act(() => result.current(new MouseEvent('click')));
    expect(useEditorStore.getState().selectedIds).toEqual([
      objects[1].userData.id,
    ]);
    expect(useEditorStore.getState().cars).toHaveLength(2);
    expect(mocks.attach).not.toHaveBeenCalled();
  });
});
