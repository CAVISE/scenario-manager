import SpeedDialTooltipOpen from './SpeedDialTooltipOpen';
import { CoordinatesWidget } from './CoordinateWidget';
import { EditorToolbar } from './toolbar';
import { EditorTransformControls } from './EditorTransformControls';
import { lazy, Suspense } from 'react';

const RightPanel = lazy(() => import('./right-panel'));
const EditorModals = lazy(() => import('./EditorModals'));
export function EditorUI() {
  return (
    <>
      <EditorToolbar />

      <EditorTransformControls />

      <SpeedDialTooltipOpen />

      <Suspense fallback={null}>
        <RightPanel />
      </Suspense>

      <Suspense fallback={null}>
        <EditorModals />
      </Suspense>

      <CoordinatesWidget />
    </>
  );
}
