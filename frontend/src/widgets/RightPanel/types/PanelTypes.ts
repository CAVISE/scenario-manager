import type { Vec3 } from '@/shared/types/sceneTypes';
import type React from 'react';
import type { EditorTab } from '@widgets/EditorNavigation/types/EditorNavigationTypes';
import type { ScenarioControls } from '../components/ScenarioControlWidget/types/ScenarioControlWidgetTypes';

export type SceneNode = { id: string; name: string; children?: SceneNode[] };

export interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export type SelectedObject = {
  type:
    | 'car'
    | 'rsu'
    | 'point'
    | 'building'
    | 'lidar'
    | 'route-point'
    | 'pedestrian';
  id?: string;
  position?: Vec3;
} | null;

export type RightPanelProps = {
  activeTab?: EditorTab;
  showSceneGraph?: boolean;
  readOnly?: boolean;
  controls: ScenarioControls;
  onTabChange: (tab: EditorTab) => void;
  preferredResultRunId?: string | null;
};

export type PropertiesMode = 'basic' | 'advanced';

export interface WorkspaceContentProps {
  tab: 'simulation' | 'results';
  controls: ScenarioControls;
  connected: boolean;
  onOpenContext: () => void;
  onOpenResults: () => void;
  preferredResultRunId?: string | null;
}
