import { act, renderHook, waitFor } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { useEditorStore } from '@/store';
import { useRSUMeshSync } from '../ui/useRSUMeshSync';

const { refs, updateSceneGraph } = vi.hoisted(() => ({
  refs: {
    sceneRef: { current: null as THREE.Scene | null },
    rsuRenderMeshesRef: { current: [] as THREE.Mesh[] },
    rsuObjectMeshesRef: { current: [] as THREE.Mesh[] },
    rsuMeshesRef: { current: [] as THREE.Mesh[] },
    transformControlsRef: { current: null },
    isDraggingRef: { current: false },
  },
  updateSceneGraph: vi.fn(),
}));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => refs,
  useHooks: () => ({ updateSceneGraph }),
}));

it('moves cached RSUs while another model is pending and uses latest positions when it loads', async () => {
  let finishTrafficLight: (() => void) | undefined;
  const load = vi
    .spyOn(GLTFLoader.prototype, 'load')
    .mockImplementation((url, onLoad) => {
      const scene = new THREE.Group();
      scene.name = url;
      scene.add(
        new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
      );
      const finish = () => onLoad({ scene } as Parameters<typeof onLoad>[0]);
      if (url === '/pedestrian_traffic_light.glb') finishTrafficLight = finish;
      else finish();
    });
  refs.sceneRef.current = new THREE.Scene();
  useEditorStore.setState({ RSUs: [], selectedRsuModel: 'hydrant' });
  const { unmount } = renderHook(() => useRSUMeshSync());
  try {
    act(() => {
      useEditorStore.getState().addRSU(1, 2, 3);
    });
    await waitFor(() =>
      expect(refs.rsuRenderMeshesRef.current[0]?.name).toBe('/hydrant.glb')
    );
    const hydrant = refs.rsuRenderMeshesRef.current[0];
    act(() => {
      useEditorStore.getState().setSelectedRsuModel('traffic-light');
      useEditorStore.getState().addRSU(4, 5, 6);
    });
    expect(finishTrafficLight).toBeDefined();
    const trafficId = useEditorStore.getState().RSUs[1].id;
    await act(async () => {
      useEditorStore
        .getState()
        .updateRSU(hydrant.userData.id, { x: 10, y: 20, z: 30 });
      useEditorStore.getState().updateRSU(trafficId, { x: 40 });
    });
    expect(hydrant.position.toArray()).toEqual([10, 20, 30]);
    await act(async () => {
      finishTrafficLight!();
    });
    expect(refs.rsuRenderMeshesRef.current).toHaveLength(2);
    expect(refs.rsuRenderMeshesRef.current[0]).toBe(hydrant);
    const traffic = refs.rsuRenderMeshesRef.current.find(
      (mesh) => mesh.userData.id === trafficId
    )!;
    expect(traffic.name).toBe('/pedestrian_traffic_light.glb');
    expect(traffic.position.toArray()).toEqual([40, 5, 6]);
    expect(traffic.userData.isFallbackRSU).toBe(false);
    expect(load).toHaveBeenCalledTimes(2);
  } finally {
    unmount();
    finishTrafficLight?.();
    load.mockRestore();
    useEditorStore.setState({ RSUs: [], selectedRsuModel: 'hydrant' });
  }
});
