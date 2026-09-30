import { TabCategories } from '../types/TelemetryModalTypes';

export const IMAGE_CATEGORIES = {
  ROUTES: {
    patterns: [/_routes\.png$/i, /(route|planned|actual|fig\d+)/i],
    tab: 'routes' as TabCategories,
  },
  LOCALIZATION: {
    patterns: [
      /_localization_plotting\.png$/i,
      /_kinematics_plotting\.png$/i,
      /(localization|kinematics)/i,
    ],
    tab: 'localization' as TabCategories,
  },
  TELEMETRY: {
    patterns: [
      /_velocity\.png$/i,
      /_imu\.png$/i,
      /_hazard\.png$/i,
      /_distance_over_time\.png$/i,
      /_rsu_coverage\.png$/i,
      /(event|accelerometer|gyro|collide|offroad|stuck|traffic)/i,
    ],
    tab: 'telemetry' as TabCategories,
  },
} as const;

export const DEFAULT_TAB: TabCategories = 'routes';
export const API_ENDPOINTS = {
  STATUS: 'api/status',
  RESULTS: (runId: string) => `api/results/${encodeURIComponent(runId)}`,
} as const;
