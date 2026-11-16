import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { GLTFLoader } from 'three-stdlib';
import { useEditorStore } from '@/store';
import { useRSUMeshSync } from '../ui/useRSUMeshSync';

const { refs } = vi.hoisted(() => ({
  refs: {
    sceneRef: { current: null as THREE.Scene | null },
    rsuRenderMeshesRef: { current: [] as THREE.Mesh[] },
    rsuObjectMeshesRef: { current: [] as THREE.Mesh[] },
    rsuMeshesRef: { current: [] as THREE.Mesh[] },
    transformControlsRef: { current: null },
    isDraggingRef: { current: false },
  },
}));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => refs,
  useHooks: () => ({ updateSceneGraph }),
}));

const updateSceneGraph = vi.fn();

describe('RSU model selection', () => {
  it('keeps mixed models and their resources independent when switching selection and deleting an object', async () => {
    const templates = new Map<string, THREE.Group>();
    const load = vi
      .spyOn(GLTFLoader.prototype, 'load')
      .mockImplementation((url, onLoad) => {
        const scene = new THREE.Group();
        scene.name = url;
        scene.add(
          new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
        );
        templates.set(url, scene);
        onLoad({ scene } as Parameters<typeof onLoad>[0]);
      });
    refs.sceneRef.current = new THREE.Scene();
    useEditorStore.setState({ RSUs: [], selectedRsuModel: 'hydrant' });
    const { unmount } = renderHook(() => useRSUMeshSync());
    try {
      act(() => {
        useEditorStore.getState().addRSU(1, 2, 3);
      });
      await waitFor(() =>
        expect(refs.rsuRenderMeshesRef.current).toHaveLength(1)
      );
      const hydrant = refs.rsuRenderMeshesRef.current[0];
      act(() => {
        useEditorStore.getState().setSelectedRsuModel('traffic-light');
        useEditorStore.getState().addRSU(4, 5, 6);
      });
      await waitFor(() =>
        expect(refs.rsuRenderMeshesRef.current).toHaveLength(2)
      );
      expect(refs.rsuRenderMeshesRef.current[0]).toBe(hydrant);
      expect(refs.rsuRenderMeshesRef.current.map((mesh) => mesh.name)).toEqual([
        '/hydrant.glb',
        '/pedestrian_traffic_light.glb',
      ]);
      expect(useEditorStore.getState().RSUs.map((rsu) => rsu.model)).toEqual([
        'hydrant',
        'traffic-light',
      ]);
      const templateMesh = templates.get('/hydrant.glb')!
        .children[0] as THREE.Mesh;
      const dispose = vi.spyOn(templateMesh.geometry, 'dispose');
      act(() => {
        useEditorStore.getState().removeRSU(0);
        useEditorStore.getState().setSelectedRsuModel('hydrant');
        useEditorStore.getState().addRSU(7, 8, 9);
      });
      await waitFor(() =>
        expect(refs.rsuRenderMeshesRef.current[0].name).toBe(
          '/pedestrian_traffic_light.glb'
        )
      );
      expect(refs.rsuRenderMeshesRef.current[1].name).toBe('/hydrant.glb');
      expect(refs.rsuRenderMeshesRef.current[1]).not.toBe(hydrant);
      expect(dispose).not.toHaveBeenCalled();
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      unmount();
      load.mockRestore();
      useEditorStore.setState({ RSUs: [], selectedRsuModel: 'hydrant' });
    }
  });
});
