import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { useEditorStore } from '@/store';
import SceneTreePanel from './SceneTreePanel';

vi.mock('@editor/context', () => ({
  useEditorRefs: () => ({ sceneRef: { current: new THREE.Scene() } }),
}));
vi.mock('@/components/AppToast', () => ({
  useAppToast: () => ({ success: vi.fn() }),
}));

beforeEach(() =>
  useEditorStore.setState(useEditorStore.getInitialState(), true)
);
afterEach(cleanup);

describe('Scene Graph selection', () => {
  it('keeps the full Ctrl selection, supports deselection, and finds objects by name', () => {
    const first = useEditorStore.getState().addCar(0, 0, 0, 'car', '00ff00');
    const second = useEditorStore.getState().addCar(1, 0, 0, 'car', '00ff00');
    render(<SceneTreePanel />);
    fireEvent.click(screen.getByText('Vehicle 01'));
    fireEvent.click(screen.getByText('Vehicle 02'), { ctrlKey: true });
    expect(new Set(useEditorStore.getState().selectedIds)).toEqual(
      new Set([first, second])
    );
    fireEvent.click(screen.getByText('Vehicle 01'), { ctrlKey: true });
    expect(useEditorStore.getState().selectedIds).toEqual([second]);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'Vehicle 02' },
    });
    expect(screen.queryByText('Vehicle 01')).not.toBeInTheDocument();
    expect(screen.getByText('Vehicle 02')).toBeInTheDocument();
  });

  it('allows selection during a run and disables destructive actions', () => {
    const car = useEditorStore.getState().addCar(0, 0, 0, 'car', '00ff00');
    render(<SceneTreePanel readOnly />);
    fireEvent.click(screen.getByText('Vehicle 01'));
    expect(useEditorStore.getState().selectedIds).toEqual([car]);
    fireEvent.click(screen.getByRole('button', { name: 'Scene actions' }));
    expect(
      screen.getByRole('menuitem', { name: 'Delete selected' })
    ).toHaveAttribute('aria-disabled', 'true');
    expect(
      screen.getByRole('menuitem', { name: 'Clear scene…' })
    ).toHaveAttribute('aria-disabled', 'true');
  });
});
