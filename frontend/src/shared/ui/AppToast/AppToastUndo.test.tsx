import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppToastProvider, useAppToast } from './AppToastProvider';

const UndoTestComponent = ({
  message,
  onUndo,
  actionLabel,
}: {
  message: string;
  onUndo: () => void;
  actionLabel?: string;
}) => {
  const toast = useAppToast();
  return (
    <button onClick={() => toast.undo(message, onUndo, actionLabel)}>
      Trigger undo toast
    </button>
  );
};

describe('AppToastProvider undo()', () => {
  it('shows the message and a default "Undo" action button', () => {
    render(
      <AppToastProvider>
        <UndoTestComponent message="Car deleted" onUndo={vi.fn()} />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger undo toast'));

    expect(screen.getByText('Car deleted')).toBeDefined();
    expect(screen.getByText('Undo')).toBeDefined();
  });

  it('invokes the onUndo callback when the action is clicked', () => {
    const onUndo = vi.fn();
    render(
      <AppToastProvider>
        <UndoTestComponent message="Car deleted" onUndo={onUndo} />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger undo toast'));
    fireEvent.click(screen.getByText('Undo'));

    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('supports a custom action label', () => {
    render(
      <AppToastProvider>
        <UndoTestComponent
          message="Scene cleared (5 objects)"
          onUndo={vi.fn()}
          actionLabel="Restore"
        />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger undo toast'));

    expect(screen.getByText('Restore')).toBeDefined();
  });

  it('can still be dismissed via the explicit close button without invoking onUndo', () => {
    const onUndo = vi.fn();
    render(
      <AppToastProvider>
        <UndoTestComponent message="Car deleted" onUndo={onUndo} />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger undo toast'));
    expect(screen.getByText('Car deleted')).toBeDefined();

    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    expect(onUndo).not.toHaveBeenCalled();
  });

  it('does not show an undo toast for a blank message', () => {
    render(
      <AppToastProvider>
        <UndoTestComponent message="   " onUndo={vi.fn()} />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Trigger undo toast'));

    expect(screen.queryByRole('alert')).toBeNull();
  });
});
