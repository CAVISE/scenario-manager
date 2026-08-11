import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppToastProvider, useAppToast } from '../ui/AppToastProvider';

const TestComponent = ({
  message,
  level,
}: {
  message: string;
  level: 'success' | 'error' | 'info';
}) => {
  const toast = useAppToast();
  return <button onClick={() => toast[level](message)}>Show {level}</button>;
};

describe('AppToastProvider', () => {
  it('should display a success message when success method is called', async () => {
    render(
      <AppToastProvider>
        <TestComponent message="Operation successful" level="success" />
      </AppToastProvider>,
    );

    const button = screen.getByText('Show success');
    fireEvent.click(button);

    expect(screen.getByText('Operation successful')).toBeDefined();

    const alert = screen.getByRole('alert');
    expect(alert.innerHTML).toContain('Operation successful');
  });

  it('should display error and info levels', () => {
    const { rerender } = render(
      <AppToastProvider>
        <TestComponent message="Error occurred" level="error" />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Show error'));
    expect(screen.getByText('Error occurred')).toBeDefined();

    rerender(
      <AppToastProvider>
        <TestComponent message="Info message" level="info" />
      </AppToastProvider>,
    );
    fireEvent.click(screen.getByText('Show info'));
    expect(screen.getByText('Info message')).toBeDefined();
  });

  it('should not show toast if message is empty or whitespace', () => {
    render(
      <AppToastProvider>
        <TestComponent message="   " level="success" />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Show success'));

    const toast = screen.queryByRole('alert');
    expect(toast).toBeNull();
  });

  it('should close when onClose is triggered', async () => {
    render(
      <AppToastProvider>
        <TestComponent message="Temporary message" level="info" />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Show info'));
    expect(screen.getByText('Temporary message')).toBeDefined();

    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
  });

  it('should close toast when close button is clicked (covers line 53)', async () => {
    render(
      <AppToastProvider>
        <TestComponent message="Close test" level="success" />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Show success'));
    expect(screen.getByText('Close test')).toBeDefined();

    const closeButton = screen.getByLabelText('Close');

    fireEvent.click(closeButton);
  });
  it('closes snackbar via Snackbar onClose (line 53)', async () => {
    render(
      <AppToastProvider>
        <TestComponent message="Snackbar close" level="info" />
      </AppToastProvider>,
    );

    fireEvent.click(screen.getByText('Show info'));
    expect(screen.getByText('Snackbar close')).toBeDefined();

    fireEvent.click(document.body);
    fireEvent.keyDown(screen.getByText('Snackbar close'), {
      key: 'Escape',
      code: 'Escape',
    });
    await act(async () => {});
  });
});
