import SpeedDialTooltipOpen from '@/pages/components/SpeedDialTooltipOpen';
import { CoordinatesWidget } from '../../CoordinateWidget';
import { EditorTransformControls } from '../../EditorTransformControls';
import { lazy, Suspense } from 'react';
import { EditorToolbar } from '../../EditorToolbar';

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
