/// <reference lib="webworker" />

import type {
  PrepareOdrGeometryRequest,
  PrepareOdrGeometryResponse,
} from '@editor/types/odrGeometryTypes';
import type { WorkerModule } from '../types/odrWorkerModuleTypes';
import {
  getGeometryTransferables,
  prepareOdrGeometryData,
} from './utils/prepareOdrGeometryData';

declare const libOpenDrive: (options: {
  locateFile: (path: string) => string;
}) => Promise<WorkerModule>;

const scope = self as DedicatedWorkerGlobalScope;
const MAP_PATH = './data.xodr';
const MAP_FILE_NAME = 'data.xodr';
const MAP_OPTIONS = {
  with_lateralProfile: true,
  with_laneHeight: true,
  with_road_objects: false,
  center_map: true,
  abs_z_for_for_local_road_obj_outline: true,
};

async function prepareGeometry({
  xodr,
  resolution,
}: PrepareOdrGeometryRequest) {
  importScripts('/lib/ModuleOpenDrive.js');
  const Module = await libOpenDrive({
    locateFile: (path) => `/lib/${path}`,
  });
  Module.FS_createDataFile('.', MAP_FILE_NAME, xodr, true, true);

  const map = new Module.OpenDriveMap(MAP_PATH, MAP_OPTIONS);
  try {
    return prepareOdrGeometryData(Module, map, resolution);
  } finally {
    map.delete();
    try {
      Module.FS_unlink(MAP_PATH);
    } catch {
      // The module may have already cleaned up after a failed map parse.
    }
  }
}

scope.addEventListener(
  'message',
  async ({ data }: MessageEvent<PrepareOdrGeometryRequest>) => {
    try {
      const geometry = await prepareGeometry(data);
      const response: PrepareOdrGeometryResponse = {
        type: 'success',
        geometry,
      };
      scope.postMessage(response, {
        transfer: getGeometryTransferables(geometry),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      scope.postMessage({
        type: 'error',
        message,
      } satisfies PrepareOdrGeometryResponse);
    }
  }
);
