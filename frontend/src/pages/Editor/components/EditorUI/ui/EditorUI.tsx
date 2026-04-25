import SpeedDialTooltipOpen from '../../../../components/SpeedDialTooltipOpen';
import { CoordinatesWidget } from '../../CoordinateWidget';
import { EditorToolbar } from '../../EditorToolbar';
import { EditorTransformControls } from '../../EditorTransformControls';
import { lazy, Suspense } from 'react';

const RightPanel = lazy(() => import('../../../../components/RightPanel'));
const EditorModals = lazy(() => import('../../EditorModals'));
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
