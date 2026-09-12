import { Vec3 } from '@editor/types/editorTypes';
import React from 'react';
import type { EditorTab } from '@editor/components/EditorNavigation/types/EditorNavigationTypes';
export const numInputSlot = {
  input: {
    onKeyDown: (e: React.KeyboardEvent) => e.stopPropagation(),
    step: 'any',
  },
};

export type SceneNode = { id: string; name: string; children?: SceneNode[] };

export interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export type SelectedObject = {
  type:
    'car' | 'rsu' | 'point' | 'building' | 'lidar' | 'circle' | 'pedestrian';
  id?: string;
  position?: Vec3;
} | null;

export type RightPanelProps = {
  activeTab?: EditorTab;
  showSceneGraph?: boolean;
  readOnly?: boolean;
  sceneGraph: SceneNode | null;
  onDetach: () => void;
  onDeleteCar: () => void;
  updateSceneGraph: () => void;
};
