export const WEATHER_OPTIONS = [
  'ClearNoon',
  'CloudyNoon',
  'WetNoon',
  'WetCloudyNoon',
  'SoftRainNoon',
  'MidRainyNoon',
  'HardRainNoon',
  'ClearSunset',
  'CloudySunset',
  'WetSunset',
  'WetCloudySunset',
  'SoftRainSunset',
  'MidRainSunset',
  'HardRainSunset',
];

export interface DatGUIFolder extends dat.GUI {
  __ul: HTMLElement;
}

export interface DatGuiParams {
  resolution: number;
  ref_line: boolean;
  roadmarks: boolean;
  wireframe: boolean;
  spotlight: boolean;
  lateralProfile: boolean;
  laneHeight: boolean;
  view_mode: string;
}

export interface UseDatGuiOptions {
  onLoadFile: (fileText: string) => void;
  onReloadMap: () => void;
  onFitView: () => void;
  onAddCube: () => void;
  onAddRSU: () => void;
  onAddPoints: () => void;
  onDeleteCube: () => void;
  onSave: () => void;
  onColorChange: (hex: string) => void;
  onNameChange: (name: string) => void;

  meshVisRef: React.MutableRefObject<{
    refline_lines?: { visible: boolean } | null;
    roadmarks_mesh?: { visible: boolean } | null;
    roadmark_outline_lines?: { visible: boolean } | null;
    road_network_material?: { wireframe: boolean } | null;
  }>;

  scenarioSettingsRef: React.MutableRefObject<{
    scenario_id: string;
    scenario_name: string;
    vehicle: string;
    weather: string;
  }>;
}
