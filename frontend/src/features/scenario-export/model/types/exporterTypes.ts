import type { EditorState } from '@/store/types/useEditorStoreTypes';

export type OpenCDAArtifactState = Pick<
  EditorState,
  'simConfig' | 'cars' | 'RSUs' | 'points' | 'lidars'
>;

export type OpenCDAWeatherParams = {
  sun_altitude_angle: number;
  cloudiness: number;
  precipitation: number;
  precipitation_deposits: number;
  wind_intensity: number;
  fog_density: number;
  fog_distance: number;
  fog_falloff: number;
  wetness: number;
};

export interface Coordinate {
  x: number;
  y: number;
}

export interface LaneGeometry {
  id: string;
  edgeId: string;
  index: number;
  length: number;
  type: string;
  shape: Coordinate[];
}

export interface LaneConnection {
  fromEdge: string;
  fromLane: number;
  toEdge: string;
  toLane: number;
}

export interface SumoNetwork {
  offsetX: number;
  offsetY: number;
  lanes: LaneGeometry[];
  connections: LaneConnection[];
  edgeLengths: Map<string, number>;
  successors: Map<string, Set<string>>;
}

export interface SumoRouteAnchor {
  edgeId: string;
  laneId: string;
  laneIndex: number;
  pos: number;
  distance: number;
}

export interface GeneratedSumoRoute {
  edges: string;
  depart?: SumoRouteAnchor;
  arrival?: SumoRouteAnchor;
  warnings: string[];
}

export type GeneratedSumoRoutes = Record<string, GeneratedSumoRoute>;

export interface LoadedSumoNetwork {
  filename: string;
  content: string;
}

export interface ShapeProjection {
  distanceSquared: number;
  direction: Coordinate | null;
  position: number;
}

export interface SumoHeapNode {
  distance: number;
  edgeId: string;
}
