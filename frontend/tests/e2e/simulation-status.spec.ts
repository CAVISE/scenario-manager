import { expect, test } from './fixtures';

test.describe('simulation status channel', () => {
  test('projects running and failed WebSocket states into the simulation workspace', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      type StatusMessage = Record<string, unknown>;
      type MockSocket = {
        onopen: ((event: Event) => void) | null;
        onmessage: ((event: MessageEvent<string>) => void) | null;
        onclose: ((event: CloseEvent) => void) | null;
        onerror: ((event: Event) => void) | null;
        close: () => void;
      };
      const sockets: MockSocket[] = [];

      class SimulationWebSocket implements MockSocket {
        onopen: ((event: Event) => void) | null = null;
        onmessage: ((event: MessageEvent<string>) => void) | null = null;
        onclose: ((event: CloseEvent) => void) | null = null;
        onerror: ((event: Event) => void) | null = null;

        constructor() {
          sockets.push(this);
          queueMicrotask(() => this.onopen?.(new Event('open')));
        }

        close() {
          this.onclose?.(new CloseEvent('close'));
        }
      }

      (window as unknown as { WebSocket: typeof WebSocket }).WebSocket =
        SimulationWebSocket as unknown as typeof WebSocket;
      (
        window as unknown as {
          emitSimulationStatus: (status: StatusMessage) => void;
        }
      ).emitSimulationStatus = (status) => {
        sockets
          .at(-1)
          ?.onmessage?.(
            new MessageEvent('message', { data: JSON.stringify(status) })
          );
      };
    });

    await page.goto('/editor');
    await expect(page.locator('.sm-loader-root')).toHaveCount(0, {
      timeout: 30_000,
    });
    await page.getByRole('tab', { name: 'Simulation' }).click();

    await page.evaluate(() =>
      (
        window as unknown as {
          emitSimulationStatus: (status: Record<string, unknown>) => void;
        }
      ).emitSimulationStatus({
        status: 'running',
        run_id: 'run-e2e-42',
        tick: 25,
        max_ticks: 100,
      })
    );

    await expect(
      page.getByRole('heading', { name: 'Simulation in progress' })
    ).toBeVisible();
    await expect(page.getByLabel('Simulation progress')).toHaveAttribute(
      'value',
      '25'
    );
    await expect(page.getByText('Run run-e2e-42')).toBeVisible();

    await page.evaluate(() =>
      (
        window as unknown as {
          emitSimulationStatus: (status: Record<string, unknown>) => void;
        }
      ).emitSimulationStatus({
        status: 'error',
        run_id: 'run-e2e-42',
        error: 'CARLA process exited unexpectedly',
      })
    );

    await expect(
      page.getByRole('heading', { name: 'Run interrupted' })
    ).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText(
      'CARLA process exited unexpectedly'
    );
  });
});
