import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SharedMouseContext, UseMouseEventsOptions } from './mouseEvents/types/IMouseEventsTypes';
import { useMouseMoveHandler } from './mouseEvents/useMouseMoveHandler';
import { useClickHandler } from './mouseEvents/useClickHandler';
import { useDblClickHandler } from './mouseEvents/useDblClickHandler';
import { useContextMenuHandler } from './mouseEvents/useContextMenuHandler';
import { useKeyDownHandler } from './mouseEvents/useKeyDownHandler';

export function useMouseEvents(opts: UseMouseEventsOptions) {
  const mouseRef     = useRef(new THREE.Vector2());
  const raycasterRef = useRef(new THREE.Raycaster());

  const ctx: SharedMouseContext = {
    mouse: mouseRef.current,
    raycaster: raycasterRef.current,
    setMouse: (e: MouseEvent) => {
      mouseRef.current.x =  (e.clientX / window.innerWidth)  * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    insidePanel: (e: MouseEvent) =>
      !!document.querySelector('.rp-root')?.contains(e.target as Node),
  };

  const onMouseMove   = useMouseMoveHandler(ctx);
  const onClick       = useClickHandler(ctx);
  const onDblClick    = useDblClickHandler(opts, ctx);
  const onContextMenu = useContextMenuHandler(ctx);
  const onKeyDown     = useKeyDownHandler(opts);

  useEffect(() => {
    window.addEventListener('mousemove',   onMouseMove);
    window.addEventListener('click',       onClick);
    window.addEventListener('dblclick',    onDblClick);
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('keydown',     onKeyDown);

    return () => {
      window.removeEventListener('mousemove',   onMouseMove);
      window.removeEventListener('click',       onClick);
      window.removeEventListener('dblclick',    onDblClick);
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('keydown',     onKeyDown);
    };
  }, [onMouseMove, onClick, onDblClick, onContextMenu, onKeyDown]);
}
