import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useEditorStore } from '@/store';
import { EditorTransformControls } from './EditorTransformControls';

const { handleAddRSU } = vi.hoisted(() => ({ handleAddRSU: vi.fn() }));

vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({
    transformControlsRef: { current: null },
    threeRef: { current: null },
  }),
  useHooks: () => ({ handleAddRSU }),
}));
vi.mock('@editor/hooks/useEditorEngine/useTransformMode', () => ({
  useTransformMode: () => ({
    transformMode: 'translate',
    handleSetMode: vi.fn(),
  }),
}));
vi.mock('./EditorObjectActions', () => ({ EditorObjectActions: () => null }));

it('opens RSU choices without placing an object and changes only future placements', () => {
  useEditorStore.setState({
    RSUs: [],
    selectedIds: [],
    selectedRsuModel: 'hydrant',
  });
  useEditorStore.getState().addRSU(1, 2, 3);
  const original = useEditorStore.getState().RSUs[0];
  const { unmount } = render(<EditorTransformControls />);
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Add object' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'RSU' }));
    expect(handleAddRSU).not.toHaveBeenCalled();
    expect(screen.getByRole('menuitem', { name: 'Hydrant' })).toBeTruthy();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Traffic light' }));
    expect(handleAddRSU).toHaveBeenCalledTimes(1);
    expect(useEditorStore.getState().selectedRsuModel).toBe('traffic-light');
    expect(useEditorStore.getState().RSUs).toEqual([original]);
    useEditorStore.getState().addRSU(4, 5, 6);
    expect(useEditorStore.getState().RSUs.map((rsu) => rsu.model)).toEqual([
      'hydrant',
      'traffic-light',
    ]);
  } finally {
    unmount();
    useEditorStore.setState({ RSUs: [], selectedRsuModel: 'hydrant' });
  }
});
