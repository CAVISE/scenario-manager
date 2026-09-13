import { expect, test as base, type Page } from '@playwright/test';

export const scenarioSummary = {
  id: 1,
  scenario_id: 'mock-1',
  name: 'Mock scenario',
  preview: null,
  annotation: 'E2E scenario with four object types',
};

const scenario = {
  ...scenarioSummary,
  name_of_scenario: scenarioSummary.name,
  file_: null,
  scenario_text: [
    {
      vehicle: 'car',
      path: [
        {
          id: 'mock-car-1',
          x: 10,
          y: 20,
          z: 0,
          model: 'car',
          color: 65280,
          points: [],
          lidars: [],
        },
      ],
    },
    {
      vehicle: 'RSU',
      path: [
        {
          id: 'mock-rsu-1',
          x: 15,
          y: 25,
          z: 0,
          tx_power: 10,
          frequency: 5.9e9,
          range: 100,
          protocol: 'ITS-G5',
        },
      ],
    },
    {
      vehicle: 'pedestrian',
      path: [
        {
          id: 'mock-pedestrian-1',
          x: 12,
          y: 22,
          z: 0,
          speed: 1.2,
          cross_factor: 0.5,
          is_invincible: false,
          tx_power: 10,
          frequency: 5.9e9,
          protocol: 'DSRC',
          beacon_interval: 1000,
        },
      ],
    },
    {
      vehicle: 'building',
      path: [
        {
          id: 'mock-building-1',
          x: 30,
          y: 10,
          z: 0,
          height: 20,
          material: 'concrete',
          scale: 0.5,
          rotation: 0,
        },
      ],
    },
  ],
};

export const idleSimulation = {
  running: false,
  status: 'idle',
  error: null,
  map: null,
  run_id: null,
  tick: 0,
  max_ticks: 0,
  partial: false,
};

export const test = base.extend<{ mockApi: void }>({
  mockApi: [
    async ({ page }, use) => {
      // Each test gets a fresh browser context. Do not clear localStorage on
      // navigation: theme persistence is part of the behavior under test.
      await page.routeWebSocket('**/api/ws/simulation', (socket) => {
        socket.send(JSON.stringify(idleSimulation));
      });
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const path = new URL(request.url()).pathname;
        if (request.method() !== 'GET') {
          throw new Error(
            `Unexpected API write in E2E: ${request.method()} ${path}`
          );
        }
        switch (path) {
          case '/api/load_all_scenarios':
            await route.fulfill({
              json: {
                status: 'success',
                count: 1,
                scenarios: [scenarioSummary],
              },
            });
            break;
          case '/api/load_scenario/mock-1':
            await route.fulfill({ json: { status: 'success', scenario } });
            break;
          case '/api/status':
            await route.fulfill({ json: idleSimulation });
            break;
          case '/api/results':
            await route.fulfill({ json: [] });
            break;
          default:
            throw new Error(`Unmocked API request in E2E: ${path}`);
        }
      });
      await use();
    },
    { auto: true },
  ],
});

export { expect };

export async function waitForEditor(page: Page) {
  await expect(page.getByTestId('editor-workspace')).toHaveAttribute(
    'aria-busy',
    'false',
    { timeout: 30_000 }
  );
  await expect(
    page.getByTestId('editor-canvas').locator('canvas')
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'File menu', exact: true })
  ).toBeEnabled();
}

export async function openEditor(page: Page) {
  await page.goto('/');
  await page.getByTestId('open-editor').click();
  await expect(page).toHaveURL(/\/editor$/);
  await waitForEditor(page);
}

export async function showSceneObjects(page: Page) {
  const toggle = page.getByRole('button', { name: 'Toggle scene objects' });
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await expect(page.locator('#editor-scene-objects')).toBeVisible();
}

export function objectNames(page: Page, name?: RegExp) {
  const names = page
    .locator('#editor-scene-objects .stp-node')
    .filter({ has: page.locator('.stp-node-badge') })
    .locator('.stp-node-name');
  return name ? names.filter({ hasText: name }) : names;
}

export function undoButton(page: Page) {
  return page
    .getByTestId('editor-workspace')
    .getByRole('button', { name: 'Undo', exact: true });
}

export async function openScenarioPicker(page: Page) {
  await page.getByRole('button', { name: 'File menu', exact: true }).click();
  await page.getByRole('menuitem', { name: 'Upload', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Load Scenario' })
  ).toBeVisible();
}

export async function loadScenario(page: Page) {
  await openScenarioPicker(page);
  await page.getByRole('button', { name: /Mock scenario/ }).click();
  await page
    .getByRole('button', { name: 'Load onto scene', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Load Scenario' })
  ).toBeHidden();
  await waitForEditor(page);
  await showSceneObjects(page);
  await expectScenarioObjects(page);
}

export async function expectScenarioObjects(page: Page) {
  await expect(objectNames(page)).toHaveCount(4);
  for (const name of [
    /^(Car|Vehicle)\b/i,
    /^RSU\b/i,
    /^Building\b/i,
    /^Pedestrian\b/i,
  ]) {
    await expect(objectNames(page, name)).toHaveCount(1);
  }
}

export async function openAddObject(page: Page) {
  await page.getByRole('button', { name: 'Add object', exact: true }).click();
  await expect(page.getByRole('menu')).toBeVisible();
}

export async function placeObject(
  page: Page,
  name: 'Building' | 'Pedestrian' | 'RSU'
) {
  await openAddObject(page);
  await page.getByRole('menuitem', { name, exact: true }).click();
  await expect(page.getByRole('menu', { includeHidden: true })).toHaveCount(0);
  const canvas = page.getByTestId('editor-canvas');
  // The lower clear strip of the default Town03 view is outside its roads
  // (buildings cannot overlap roads). Also check for DOM panels at that point.
  const position = await canvas.evaluate((container) => {
    const bounds = container.getBoundingClientRect();
    for (const yRatio of [0.9, 0.85]) {
      for (const xRatio of [0.55, 0.6, 0.5, 0.45]) {
        const x = bounds.left + bounds.width * xRatio;
        const y = bounds.top + bounds.height * yRatio;
        const target = document.elementFromPoint(x, y);
        if (target instanceof HTMLCanvasElement && container.contains(target)) {
          return { x: x - bounds.left, y: y - bounds.top };
        }
      }
    }
    throw new Error(
      'No unobstructed canvas point found below the Town03 roads'
    );
  });
  await canvas.dblclick({ position });
  await showSceneObjects(page);
}
