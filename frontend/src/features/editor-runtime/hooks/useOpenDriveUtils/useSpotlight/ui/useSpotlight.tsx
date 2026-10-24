import { setCanvasReference } from '@right-panel/components/ScenarioControlWidget/Handlers/ui/scenario.load.handler';
import type {
  AnimationHandle,
  StartAnimateParams,
  SpotlightState,
} from '../types/useSpotlightTypes';
import { performSpotlightPick } from '../utils/performSpotlightPick';

const FRAME_MS = 1000 / 30;
const PICKING_MS = 100;

export function startAnimate(params: StartAnimateParams): AnimationHandle {
  let mouseMoved = false;
  const canvas = params.renderer.domElement;
  setCanvasReference(canvas);

  const handle: AnimationHandle = {
    running: true,
    invalidate: () => {},
    stop: () => {},
  };
  const onMouseMove = () => {
    mouseMoved = true;
    handle.invalidate();
  };
  canvas.addEventListener('mousemove', onMouseMove);

  let lastFrameTime = 0;
  let lastPickingTime = 0;
  let frameId: number | null = null;
  let delayId: number | null = null;
  let needsRender = true;

  const scheduleFrame = (minimumDelay = 0) => {
    if (!handle.running || frameId !== null || delayId !== null) return;
    const wait = Math.max(
      minimumDelay,
      lastFrameTime ? FRAME_MS - (performance.now() - lastFrameTime) : 0
    );
    if (wait > 0) {
      delayId = window.setTimeout(() => {
        delayId = null;
        frameId = requestAnimationFrame(animate);
      }, wait);
      return;
    }
    frameId = requestAnimationFrame(animate);
  };

  handle.invalidate = () => {
    needsRender = true;
    scheduleFrame();
  };
  const onControlsChange = () => handle.invalidate();
  params.controls.addEventListener('change', onControlsChange);

  function animate(now: number) {
    frameId = null;
    if (!handle.running) return;
    const frameStartedAt = performance.now();
    let pickingTimeMs = 0;
    lastFrameTime = now;
    params.controls.update();

    const { spotlightState } = params;
    if (
      params.spotlightEnabled() &&
      !spotlightState.paused &&
      mouseMoved &&
      now - lastPickingTime >= PICKING_MS
    ) {
      const pickingStartedAt = performance.now();
      mouseMoved = false;
      lastPickingTime = now;
      try {
        performSpotlightPick(params, spotlightState);
      } catch (error) {
        console.error(
          '[SpotlightAnimate] error in picking/highlight block:',
          error
        );
      } finally {
        pickingTimeMs = performance.now() - pickingStartedAt;
      }
    }

    if (mouseMoved && params.spotlightEnabled() && !spotlightState.paused) {
      needsRender = true;
      scheduleFrame(PICKING_MS - (now - lastPickingTime));
    }
    if (!needsRender) return;

    needsRender = false;
    params.onBeforeRender?.();
    params.renderer.render(params.scene, params.camera);
    params.performanceMonitor?.recordFrame(
      performance.now() - frameStartedAt,
      pickingTimeMs,
      params.renderer.info
    );
    if (params.controls.autoRotate) {
      needsRender = true;
      scheduleFrame();
    }
  }

  handle.stop = () => {
    handle.running = false;
    if (frameId !== null) cancelAnimationFrame(frameId);
    if (delayId !== null) window.clearTimeout(delayId);
    canvas.removeEventListener('mousemove', onMouseMove);
    params.controls.removeEventListener('change', onControlsChange);
  };
  handle.invalidate();
  return handle;
}

export function createSpotlightState(): SpotlightState {
  return {
    paused: false,
    INTERSECTED_LANE_ID: 0xffffffff,
    INTERSECTED_ROADMARK_ID: 0xffffffff,
  };
}
