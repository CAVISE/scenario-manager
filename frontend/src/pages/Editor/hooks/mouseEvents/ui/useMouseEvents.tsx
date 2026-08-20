import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SharedMouseContext } from '../types/IMouseEventsTypes';
import { useMouseMoveHandler } from '../handlers/useMouseMoveHandler';
import { useClickHandler } from '../handlers/useClickHandler';
import { useDblClickHandler } from '../handlers/useDblClickHandler';
import { useKeyDownHandler } from '../handlers/useKeyDownHandler';
import { useAppToast } from '@/components/AppToast';

export function useMouseEvents() {
  const toast = useAppToast();
  const mouseRef = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());
  const ctx: SharedMouseContext = {
    mouse: mouseRef.current,
    raycaster: raycasterRef.current,
    setMouse: (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    insideEditorCanvas: (e: MouseEvent) =>
      !!document
        .querySelector('[data-testid="editor-canvas"]')
        ?.contains(e.target as Node),
  };

  const onMouseMove = useMouseMoveHandler(ctx);
  const onClick = useClickHandler(ctx);
  const onDblClick = useDblClickHandler(ctx);
  const onKeyDown = useKeyDownHandler({ toast });

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    window.addEventListener('dblclick', onDblClick);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('dblclick', onDblClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onMouseMove, onClick, onDblClick, onKeyDown]);
}
