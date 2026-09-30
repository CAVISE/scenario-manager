import { useEffect } from 'react';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import { useWorkspacePreferences } from '@/store/ui/useWorkspacePreferences';
import { useEditorRefs, useHooks } from '@editor/context';
import { findObjectInScene } from '@right-panel/components/SceneTreePanel/funcs/sceneUtils';

export function useSelectionSceneSync(readOnly: boolean) {
  const showOutlines = useWorkspacePreferences(
    (state) => state.showSelectionOutline
  );
  const selectedIds = useEditorStore((s) => s.selectedIds);
  const { sceneGraph } = useHooks();
  const { sceneRef, transformControlsRef, cameraRef, threeRef } =
    useEditorRefs();

  useEffect(() => {
    const scene = sceneRef.current;
    const tc = transformControlsRef.current;
    if (!scene || !tc) return;
    const objects = selectedIds.flatMap((itemId) => {
      const object = findObjectInScene({ itemId, sceneRef });
      return object ? [object] : [];
    });
    if (!readOnly && selectedIds.length === 1 && objects.length === 1)
      tc.attach(objects[0]);
    else tc.detach();

    const helpers = (showOutlines ? objects : []).map((object) => {
      const helper = new THREE.BoxHelper(object, 0x2563eb);
      helper.name = 'SelectionOutline';
      helper.raycast = () => {};
      scene.add(helper);
      return helper;
    });
    let frame = 0;
    const update = () => {
      helpers.forEach((helper) => helper.update());
      frame = requestAnimationFrame(update);
    };
    if (helpers.length) update();
    return () => {
      cancelAnimationFrame(frame);
      helpers.forEach((helper) => {
        scene.remove(helper);
        helper.dispose();
      });
    };
  }, [
    selectedIds,
    readOnly,
    sceneGraph,
    sceneRef,
    transformControlsRef,
    showOutlines,
  ]);

  useEffect(() => {
    const focus = (event: Event) => {
      const requested = (event as CustomEvent<{ id?: string }>).detail?.id;
      const ids = requested
        ? [requested]
        : useEditorStore.getState().selectedIds;
      const bounds = new THREE.Box3();
      ids.forEach((itemId) => {
        const object = findObjectInScene({ itemId, sceneRef });
        if (object) bounds.expandByObject(object);
      });
      const camera = cameraRef.current;
      const controls = threeRef.current?.controls;
      if (bounds.isEmpty() || !camera || !controls) return;
      const center = bounds.getCenter(new THREE.Vector3());
      const direction = camera.position.clone().sub(controls.target);
      if (direction.lengthSq() === 0) direction.set(1, 1, 1);
      const distance = Math.max(
        bounds.getSize(new THREE.Vector3()).length() * 1.6,
        6
      );
      camera.position
        .copy(center)
        .add(direction.normalize().multiplyScalar(distance));
      controls.target.copy(center);
      controls.update();
    };
    window.addEventListener('editor-focus-object', focus);
    window.addEventListener('editor-focus-selection', focus);
    return () => {
      window.removeEventListener('editor-focus-object', focus);
      window.removeEventListener('editor-focus-selection', focus);
    };
  }, [sceneRef, cameraRef, threeRef]);
}
