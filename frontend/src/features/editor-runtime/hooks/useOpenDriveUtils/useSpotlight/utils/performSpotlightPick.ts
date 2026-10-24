import * as THREE from 'three';
import { decodeUInt32, isValid } from '@/shared/lib/editorUtils';
import { applyVertexColors } from '@editor/scene/utils/sceneHelpers';
import { COLORS } from '../../useOdrMap/constants/useOdrMapConstants';
import type {
  OdrLanesMesh,
  OdrRoadmarksMesh,
} from '@editor/scene/utils/sceneHelpers/types/sceneHelpersTypes';
import type {
  StartAnimateParams,
  SpotlightState,
} from '../types/useSpotlightTypes';

/** Renders one pixel of the picking scenes and updates highlighted road data. */
export function performSpotlightPick(
  params: StartAnimateParams,
  state: SpotlightState
): void {
  const { renderer, camera, mouse, picking } = params;
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

  const laneBuffer = new Float32Array(4);
  const roadmarkBuffer = new Float32Array(4);
  const positionBuffer = new Float32Array(4);
  renderer.readRenderTargetPixels(
    picking.textures.lane,
    0,
    0,
    1,
    1,
    laneBuffer
  );
  renderer.readRenderTargetPixels(
    picking.textures.roadmark,
    0,
    0,
    1,
    1,
    roadmarkBuffer
  );
  renderer.readRenderTargetPixels(
    picking.textures.xyz,
    0,
    0,
    1,
    1,
    positionBuffer
  );

  const odrMap = params.getOpenDriveMap();
  if (odrMap) {
    positionBuffer[0] += odrMap.x_offs;
    positionBuffer[1] += odrMap.y_offs;
  }
  camera.clearViewOffset();
  renderer.setRenderTarget(null);

  const roadMesh = params.getRoadMesh();
  const roadmarkMesh = params.getRoadmarksMesh();
  updateLaneHighlight(roadMesh, laneBuffer, state, params.spotlightInfo);
  updateRoadmarkHighlight(roadMesh, roadmarkMesh, roadmarkBuffer, state);
}

function updateLaneHighlight(
  roadMesh: THREE.Mesh | null,
  buffer: Float32Array,
  state: SpotlightState,
  spotlightInfo?: HTMLElement | null
): void {
  if (roadMesh && isValid(buffer)) {
    const laneId = decodeUInt32(buffer);
    const lanes: OdrLanesMesh =
      roadMesh.userData.odr_road_network_mesh.lanes_mesh;
    if (state.INTERSECTED_LANE_ID !== laneId) {
      if (state.INTERSECTED_LANE_ID !== 0xffffffff) {
        const previous = lanes.get_idx_interval_lane(state.INTERSECTED_LANE_ID);
        roadMesh.geometry.attributes.color.array.fill(
          COLORS.road,
          previous[0] * 3,
          previous[1] * 3
        );
      }
      state.INTERSECTED_LANE_ID = laneId;
      const interval = lanes.get_idx_interval_lane(laneId);
      applyVertexColors(
        roadMesh.geometry.attributes.color,
        new THREE.Color(COLORS.lane_highlight),
        interval[0],
        interval[1] - interval[0]
      );
      roadMesh.geometry.attributes.color.needsUpdate = true;
      if (spotlightInfo) spotlightInfo.style.display = 'block';
    }
    lanes.delete();
    return;
  }

  if (!roadMesh || state.INTERSECTED_LANE_ID === 0xffffffff) return;
  const lanes: OdrLanesMesh =
    roadMesh.userData.odr_road_network_mesh.lanes_mesh;
  const interval = lanes.get_idx_interval_lane(state.INTERSECTED_LANE_ID);
  roadMesh.geometry.attributes.color.array.fill(
    COLORS.road,
    interval[0] * 3,
    interval[1] * 3
  );
  roadMesh.geometry.attributes.color.needsUpdate = true;
  lanes.delete();
  state.INTERSECTED_LANE_ID = 0xffffffff;
  if (spotlightInfo) spotlightInfo.style.display = 'none';
}

function updateRoadmarkHighlight(
  roadMesh: THREE.Mesh | null,
  roadmarkMesh: THREE.Mesh | null,
  buffer: Float32Array,
  state: SpotlightState
): void {
  if (roadmarkMesh && roadMesh && isValid(buffer)) {
    const roadmarkId = decodeUInt32(buffer);
    const roadmarks: OdrRoadmarksMesh =
      roadMesh.userData.odr_road_network_mesh.roadmarks_mesh;
    if (state.INTERSECTED_ROADMARK_ID !== roadmarkId) {
      if (state.INTERSECTED_ROADMARK_ID !== 0xffffffff) {
        const previous = roadmarks.get_idx_interval_roadmark(
          state.INTERSECTED_ROADMARK_ID
        );
        roadmarkMesh.geometry.attributes.color.array.fill(
          COLORS.roadmark,
          previous[0] * 3,
          previous[1] * 3
        );
      }
      state.INTERSECTED_ROADMARK_ID = roadmarkId;
      const interval = roadmarks.get_idx_interval_roadmark(roadmarkId);
      applyVertexColors(
        roadmarkMesh.geometry.attributes.color,
        new THREE.Color(COLORS.roadmark_highlight),
        interval[0],
        interval[1] - interval[0]
      );
      roadmarkMesh.geometry.attributes.color.needsUpdate = true;
    }
    roadmarks.delete();
    return;
  }

  if (
    !roadmarkMesh ||
    !roadMesh ||
    state.INTERSECTED_ROADMARK_ID === 0xffffffff
  )
    return;
  const roadmarks: OdrRoadmarksMesh =
    roadMesh.userData.odr_road_network_mesh.roadmarks_mesh;
  const interval = roadmarks.get_idx_interval_roadmark(
    state.INTERSECTED_ROADMARK_ID
  );
  roadmarkMesh.geometry.attributes.color.array.fill(
    COLORS.roadmark,
    interval[0] * 3,
    interval[1] * 3
  );
  roadmarkMesh.geometry.attributes.color.needsUpdate = true;
  roadmarks.delete();
  state.INTERSECTED_ROADMARK_ID = 0xffffffff;
}
