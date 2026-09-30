import type { SimulationConfig } from '@scenario-export';
import type { SelectedObject, Vec3 } from '@/shared/types/sceneTypes';
import type { Car, Lidar, Point } from '@/entities/vehicle';
import type { Building } from '@/entities/building';
import type { RSU } from '@/entities/roadside-unit';
import type { Pedestrian } from '@/entities/pedestrian';
import type { Scenario } from '@/entities/scenario';
export type {
  AIMClientService,
  BehaviorServiceType,
  Car,
  CavBehaviorService,
  CavV2X,
  Lidar,
  MovementControllerService,
  Point,
  SelfInformerService,
  SumoStop,
} from '@/entities/vehicle';
export type { Building, BuildingMaterial } from '@/entities/building';
export type {
  AIMServerService,
  AntennaType,
  NetworkProtocol,
  Polarization,
  RSU,
  RsuBehaviorService,
  V2XProtocol,
} from '@/entities/roadside-unit';
export type { Pedestrian } from '@/entities/pedestrian';
export type { CarlaWeather, Scenario } from '@/entities/scenario';

export type RouteNode = Vec3[][];

export type DeletedEntity =
  | { kind: 'car'; index: number; car: Car; points: Point[]; lidars: Lidar[] }
  | { kind: 'rsu'; index: number; rsu: RSU }
  | { kind: 'building'; index: number; building: Building }
  | { kind: 'pedestrian'; index: number; pedestrian: Pedestrian }
  | { kind: 'lidar'; index: number; lidar: Lidar }
  | { kind: 'point'; index: number; point: Point };

export type DeletionSnapshot = {
  snapshotId: string;
  deletedAt: number;
  origin: 'single-delete' | 'clear-scene';
  label: string;
  entities: DeletedEntity[];
};

export type HistoryEntry = {
  id: string;
  label: string;
  timestamp: number;
  undo: () => void;
  redo: () => void;

  sourceSnapshotId?: string;
};

export type ErrorLogSource =
  | 'console'
  | 'unhandledrejection'
  | 'window.onerror'
  | 'react-boundary'
  | 'manual';

export type ErrorLogEntry = {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  source: ErrorLogSource;
  context?: string;
};

export type SimulationPhase = 'idle' | 'running' | 'finished' | 'error';

export type SimulationSession = {
  phase: SimulationPhase;
  runId: string | null;
  status: string | null;
  error: string | null;
  startedAt: number | null;
  tick?: number;
  maxTicks?: number;
  partial?: boolean;
};

export type EditorState = {
  cars: Car[];
  RSUs: RSU[];
  lidars: Lidar[];
  points: Point[];
  buildings: Building[];
  error: Error | null;
  simulationSession: SimulationSession;
  selectedIds: string[];
  isBuildingMode: boolean;
  routes: RouteNode;
  simConfig: SimulationConfig;
  Scenario: Scenario;

  sceneExplicitlyCleared: boolean;
  setSceneExplicitlyCleared: (value: boolean) => void;
  pedestrians: Pedestrian[];
  isPanelOpen: boolean;
  setError: (err: Error | null) => void;
  errorLog: ErrorLogEntry[];
  logError: (entry: Omit<ErrorLogEntry, 'id' | 'timestamp'>) => void;
  clearErrorLog: () => void;
  updateSimulationSession: (patch: Partial<SimulationSession>) => void;
  resetSimulationSession: () => void;
  setChangePanelMode: () => void;
  setBuildingMode: (value: boolean) => void;
  selectedObjects: SelectedObject[];
  clearSelection: () => void;
  updateSimConfig: (props: Partial<SimulationConfig>) => void;
  updateSimConfigOmnet: (props: Partial<SimulationConfig['omnet']>) => void;
  updateSimConfigArtery: (props: Partial<SimulationConfig['artery']>) => void;
  updateSimConfigSionna: (props: Partial<SimulationConfig['sionna']>) => void;
  updateSimConfigCarla: (props: Partial<SimulationConfig['carla']>) => void;
  updateSimConfigOpenCDA: (props: Partial<SimulationConfig['opencda']>) => void;
  updateSimConfigSumo: (props: Partial<SimulationConfig['sumo']>) => void;
  updateSimConfigCAPI: (props: Partial<SimulationConfig['capi']>) => void;
  updateSimConfigMPC: (props: Partial<SimulationConfig['mpc']>) => void;

  addCar: (
    x: number,
    y: number,
    z: number,
    model: string,
    color: string,
    speed?: number
  ) => string;
  addCarsBatch: (cars: Omit<Car, 'id'>[]) => string[];
  updateCar: (id: string, props: Partial<Omit<Car, 'id'>>) => void;
  removeCar: (id: string) => void;
  removeAllCars: () => void;
  addPedestrian: (x: number, y: number, z: number) => string;
  addPedestriansBatch: (pedestrians: Omit<Pedestrian, 'id'>[]) => string[];
  updatePedestrian: (
    id: string,
    props: Partial<Omit<Pedestrian, 'id'>>
  ) => void;
  removePedestrian: (id: string) => void;
  removeAllPedestrians: () => void;
  addRSU: (x: number, y: number, z: number) => string;
  addRSUsBatch: (rsus: Omit<RSU, 'id'>[]) => string[];
  removeRSU: (index: number) => void;
  removeAllRSUs: () => void;
  updateRSU: (id: string, props: Partial<Omit<RSU, 'id'>>) => void;

  addLidar: (carId: string, x: number, y: number, z: number) => string;
  addLidarsBatch: (lidars: Omit<Lidar, 'id'>[]) => string[];
  updateLidar: (
    id: string,
    props: Partial<Omit<Lidar, 'id' | 'carId'>>
  ) => void;
  removeLidar: (id: string) => void;
  removeLidarsByCarId: (carId: string) => void;

  updateScenario: (props: Partial<Scenario>) => void;
  addPoint: (carId: string, x: number, y: number, z: number) => string;
  addPointsBatch: (points: Omit<Point, 'id'>[]) => string[];
  removePoint: (id: string) => void;
  removePointsByCarId: (carId: string) => void;
  updatePoint: (
    id: string,
    props: Partial<Omit<Point, 'id' | 'carId'>>
  ) => void;

  selectObjects: (objs: SelectedObject[]) => void;
  toggleObjectSelection: (obj: SelectedObject) => void;
  addBuilding: (x: number, y: number, z: number) => string;
  addBuildingsBatch: (buildings: Omit<Building, 'id'>[]) => string[];
  updateBuilding: (id: string, props: Partial<Omit<Building, 'id'>>) => void;
  removeBuilding: (id: string) => void;
  removeAllBuildings: () => void;

  deletionHistory: DeletionSnapshot[];
  pushDeletionSnapshot: (
    snapshot: Omit<DeletionSnapshot, 'snapshotId' | 'deletedAt'>
  ) => string;
  restoreLastDeletion: (snapshotId?: string) => boolean;
  clearDeletionHistory: () => void;

  historyStack: HistoryEntry[];
  historyCursor: number;

  isApplyingHistory: boolean;
  pushHistoryEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => string;
  undo: () => boolean;
  redo: () => boolean;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearHistory: () => void;
};
