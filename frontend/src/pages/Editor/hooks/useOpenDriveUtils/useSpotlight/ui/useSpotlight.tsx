import * as THREE from 'three';
import { decodeUInt32, isValid } from '@/helpers/editorhelper';
import { applyVertexColors } from '@editor/scene/utils/sceneHelpers';
import { COLORS } from '../../useOdrMap/types/useOdrMapTypes';
import type {
  OdrLanesMesh,
  OdrRoadmarksMesh,
} from '@editor/scene/utils/sceneHelpers/types/sceneHelpersTypes';
import type {
  StartAnimateParams,
  SpotlightState,
} from '../types/useSpotlightTypes';
import { setCanvasReference } from '@right-panel/components/ScenarioControlWidget/Handlers/ui/scenario.load.handler';

export function startAnimate(p: StartAnimateParams): {
  running: boolean;
  stop: () => void;
} {
  let mouseMoved = false;
  const canvas = p.renderer.domElement;
  setCanvasReference(canvas);
  const onMouseMove = () => {
    mouseMoved = true;
  };
  canvas.addEventListener('mousemove', onMouseMove);

  const handle = { running: true };
  let lastTime = 0;
  const FRAME_MS = 1000 / 30;
  let lastPickingTime = 0;
  const PICKING_MS = 100;

  function animate(now: number) {
    if (!handle.running) return;
    requestAnimationFrame(animate);

    if (now - lastTime < FRAME_MS) return;
    lastTime = now;

    if (!p.controls) return;
    p.controls.update();

    const { spotlightState: st } = p;

    if (
      p.spotlightEnabled() &&
      !st.paused &&
      mouseMoved &&
      now - lastPickingTime >= PICKING_MS
    ) {
      mouseMoved = false;
      lastPickingTime = now;
      try {
        const { renderer, camera, mouse, picking } = p;

        camera.setViewOffset(
          renderer.getContext().drawingBufferWidth,
          renderer.getContext().drawingBufferHeight,
          (mouse.x * renderer.getPixelRatio()) | 0,
          (mouse.y * renderer.getPixelRatio()) | 0,
          1,
          1
        );
        renderer.setRenderTarget(picking.textures.lane);
        renderer.render(picking.scenes.lane, camera);
        renderer.setRenderTarget(picking.textures.roadmark);
        renderer.render(picking.scenes.roadmark, camera);
        renderer.setRenderTarget(picking.textures.xyz);
        renderer.render(picking.scenes.xyz, camera);

        const lb = new Float32Array(4),
          rb = new Float32Array(4),
          xb = new Float32Array(4);
        renderer.readRenderTargetPixels(picking.textures.lane, 0, 0, 1, 1, lb);
        renderer.readRenderTargetPixels(
          picking.textures.roadmark,
          0,
          0,
          1,
          1,
          rb
        );
        renderer.readRenderTargetPixels(picking.textures.xyz, 0, 0, 1, 1, xb);

        const odrMap = p.getOpenDriveMap();
        if (odrMap) {
          xb[0] += odrMap.x_offs;
          xb[1] += odrMap.y_offs;
        }
        camera.clearViewOffset();
        renderer.setRenderTarget(null);

        const roadMesh = p.getRoadMesh();
        const rmMesh = p.getRoadmarksMesh();

        if (roadMesh && isValid(lb)) {
          const lid = decodeUInt32(lb);
          const lm: OdrLanesMesh =
            roadMesh.userData.odr_road_network_mesh.lanes_mesh;
          if (st.INTERSECTED_LANE_ID !== lid) {
            if (st.INTERSECTED_LANE_ID !== 0xffffffff) {
              const prev = lm.get_idx_interval_lane(st.INTERSECTED_LANE_ID);
              roadMesh.geometry.attributes.color.array.fill(
                COLORS.road,
                prev[0] * 3,
                prev[1] * 3
              );
            }
            st.INTERSECTED_LANE_ID = lid;
            const iv = lm.get_idx_interval_lane(lid);
            applyVertexColors(
              roadMesh.geometry.attributes.color,
              new THREE.Color(COLORS.lane_highlight),
              iv[0],
              iv[1] - iv[0]
            );
            roadMesh.geometry.attributes.color.needsUpdate = true;
            if (p.spotlightInfo) p.spotlightInfo.style.display = 'block';
          }
          lm.delete();
        } else if (roadMesh && st.INTERSECTED_LANE_ID !== 0xffffffff) {
          const lm: OdrLanesMesh =
            roadMesh.userData.odr_road_network_mesh.lanes_mesh;
          const iv = lm.get_idx_interval_lane(st.INTERSECTED_LANE_ID);
          roadMesh.geometry.attributes.color.array.fill(
            COLORS.road,
            iv[0] * 3,
            iv[1] * 3
          );
          roadMesh.geometry.attributes.color.needsUpdate = true;
          lm.delete();
          st.INTERSECTED_LANE_ID = 0xffffffff;
          if (p.spotlightInfo) p.spotlightInfo.style.display = 'none';
        }

        if (rmMesh && roadMesh && isValid(rb)) {
          const rid = decodeUInt32(rb);
          const rm: OdrRoadmarksMesh =
            roadMesh.userData.odr_road_network_mesh.roadmarks_mesh;
          if (st.INTERSECTED_ROADMARK_ID !== rid) {
            if (st.INTERSECTED_ROADMARK_ID !== 0xffffffff) {
              const prev = rm.get_idx_interval_roadmark(
                st.INTERSECTED_ROADMARK_ID
              );
              rmMesh.geometry.attributes.color.array.fill(
                COLORS.roadmark,
                prev[0] * 3,
                prev[1] * 3
              );
            }
            st.INTERSECTED_ROADMARK_ID = rid;
            const iv = rm.get_idx_interval_roadmark(rid);
            applyVertexColors(
              rmMesh.geometry.attributes.color,
              new THREE.Color(COLORS.roadmark_highlight),
              iv[0],
              iv[1] - iv[0]
            );
            rmMesh.geometry.attributes.color.needsUpdate = true;
          }
          rm.delete();
        } else if (
          rmMesh &&
          roadMesh &&
          st.INTERSECTED_ROADMARK_ID !== 0xffffffff
        ) {
          const rm: OdrRoadmarksMesh =
            roadMesh.userData.odr_road_network_mesh.roadmarks_mesh;
          const iv = rm.get_idx_interval_roadmark(st.INTERSECTED_ROADMARK_ID);
          rmMesh.geometry.attributes.color.array.fill(
            COLORS.roadmark,
            iv[0] * 3,
            iv[1] * 3
          );
          rmMesh.geometry.attributes.color.needsUpdate = true;
          rm.delete();
          st.INTERSECTED_ROADMARK_ID = 0xffffffff;
        }
      } catch (err) {
        console.error(
          '[SpotlightAnimate] error in picking/highlight block:',
          err
        );
      }
    }

    p.onBeforeRender?.();
    p.renderer.render(p.scene, p.camera);
  }

  requestAnimationFrame(animate);

  return {
    ...handle,
    stop: () => {
      handle.running = false;
      canvas.removeEventListener('mousemove', onMouseMove);
    },
  };
}

export function createSpotlightState(): SpotlightState {
  return {
    paused: false,
    INTERSECTED_LANE_ID: 0xffffffff,
    INTERSECTED_ROADMARK_ID: 0xffffffff,
  };
}
