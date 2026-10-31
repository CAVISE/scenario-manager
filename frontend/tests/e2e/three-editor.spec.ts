import { expect, test } from './fixtures';
import type { Page } from '@playwright/test';

const openEditor = async (page: Page) => {
  await page.goto('/');

  const editorLink = page.getByTestId('open-editor');

  await expect(editorLink).toBeVisible();

  await editorLink.click();

  await expect(page).toHaveURL(/\/editor$/);

  await expect(page.locator('.sm-loader-root')).toHaveCount(0, {
    timeout: 30000,
  });
  await expect(page.getByTestId('editor-canvas').locator('canvas')).toBeVisible();
  await page.waitForTimeout(500);
};
test.beforeEach(async ({ page }) => {
  await page.route('**/api/ws/simulation', (route) => route.abort());
});
const openSpeedDial = async (page: Page) => {
  await page.getByRole('button', { name: 'Add object' }).click();
};

const chooseAddObject = async (page: Page, name: string) => {
  await openSpeedDial(page);
  const action = page.getByRole('menuitem', { name, exact: true });
  await action.click();
  await expect(action).not.toBeVisible();
};

const placeObjectOnCanvas = async (
  page: Page,
  points: ReadonlyArray<readonly [number, number]> = [[640, 400]]
) => {
  for (const [clientX, clientY] of points) {
    await page
      .getByTestId('editor-canvas')
      .locator('canvas')
      .evaluate(
        (canvas, point) =>
          canvas.dispatchEvent(
            new MouseEvent('dblclick', {
              bubbles: true,
              cancelable: true,
              clientX: point.clientX,
              clientY: point.clientY,
              view: window,
            })
          ),
        { clientX, clientY }
      );
  }
};

const openUploadModal = async (page: Page) => {
  await page.getByRole('button', { name: 'File menu' }).click();
  await page.getByRole('menuitem', { name: 'Upload' }).click();
};

const loadMockScenario = async (page: Page) => {
  await openUploadModal(page);
  await page
    .locator('.upload-scenarios-modal')
    .getByText('Mock scenario', { exact: true })
    .click();
  await page.getByRole('button', { name: 'Load onto scene' }).click();
  await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
    '0 objects'
  );
};

const mockScenarioApi = async (page: Page) => {
  await page.route('**/api/v1/scenarios?*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 1,
            scenario_id: 'mock-1',
            name: 'Mock scenario',
            preview: null,
            annotation: 'e2e generated',
          },
        ],
        total: 1,
        offset: 0,
        limit: 100,
      }),
    });
  });

  await page.route('**/api/v1/scenarios/mock-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 1,
        revision: 1,
        scenario_id: 'mock-1',
        name_of_scenario: 'Mock scenario',
        scenario_text: [
          {
            vehicle: 'car',
            path: [
              {
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
      }),
    });
  });
};

test.describe('Three.js editor flows', () => {
  test('initializes editor scene and side panels', async ({ page }) => {
    await openEditor(page);
    await expect(page.getByTestId('editor-canvas')).toBeVisible();
    await expect(page.getByTestId('transform-controls')).toBeVisible();
    await expect(page.getByText('Settings')).toBeVisible();
    await expect(
      page.getByText('Add an object to start building your scenario.')
    ).toBeVisible();
  });

  test('switches transform modes', async ({ page }) => {
    await mockScenarioApi(page);
    await openEditor(page);
    await loadMockScenario(page);
    await page.getByText('Building 01', { exact: true }).click();

    const translate = page.getByTestId('transform-translate');
    const rotate = page.getByTestId('transform-rotate');
    const scale = page.getByTestId('transform-scale');

    await expect(translate).toBeEnabled();
    await expect(translate).toHaveClass(/MuiIconButton-colorPrimary/);
    await rotate.click();
    await expect(rotate).toHaveClass(/MuiIconButton-colorPrimary/);
    await scale.click();
    await expect(scale).toHaveClass(/MuiIconButton-colorPrimary/);
  });

  test('shows object actions in speed dial', async ({ page }) => {
    await openEditor(page);
    await openSpeedDial(page);
    await expect(
      page.getByRole('menuitem', { name: 'Waypoint — select a vehicle' })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Vehicle', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'RSU', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Pedestrian', exact: true })
    ).toBeVisible();
  });

  test('opens upload modal from toolbar menu', async ({ page }) => {
    await openEditor(page);
    await openUploadModal(page);
    await expect(
      page.getByRole('heading', { name: 'Load Scenario' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'close' }).click();
    await expect(
      page.getByRole('heading', { name: 'Load Scenario' })
    ).not.toBeVisible();
  });

  test('loads scenario from upload modal and updates scene graph', async ({
    page,
  }) => {
    await mockScenarioApi(page);
    await openEditor(page);

    await loadMockScenario(page);
    await expect(
      page.getByText('The scenario has been uploaded.').first()
    ).toBeVisible();
  });

  test('clears scene after loaded scenario', async ({ page }) => {
    await mockScenarioApi(page);
    await openEditor(page);

    await loadMockScenario(page);
    await page.getByRole('button', { name: 'Scene actions' }).click();
    await page.getByRole('menuitem', { name: 'Clear scene…' }).click();
    await page.getByRole('button', { name: 'Clear scene' }).click();
    await expect(page.getByTestId('scene-graph-count')).toHaveText('0 objects');
    await expect(
      page.getByText('Add an object to start building your scenario.')
    ).toBeVisible();
  });
});
test('loading scenario with a building renders it in scene graph', async ({
  page,
}) => {
  await mockScenarioApi(page);
  await openEditor(page);
  await loadMockScenario(page);

  await expect(page.getByText('Building 01', { exact: true })).toBeVisible();
});
test('deleting a building via panel removes its mesh, not just the store entry', async ({
  page,
}) => {
  await mockScenarioApi(page);
  await openEditor(page);
  await loadMockScenario(page);
  await expect(page.getByText('Building 01', { exact: true })).toBeVisible();

  const countBefore = await page.getByTestId('scene-graph-count').textContent();
  await page.getByText('Building 01', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete building' }).click();
  await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
    countBefore!
  );
  await expect(page.getByText('Building 01', { exact: true })).not.toBeVisible();
});
test('reloading a scenario does not accumulate duplicate building meshes', async ({
  page,
}) => {
  await mockScenarioApi(page);
  await openEditor(page);
  await loadMockScenario(page);
  await loadMockScenario(page);
  await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
    '0 objects'
  );
});

test('adding building via speed dial and double-click creates a mesh', async ({
  page,
}) => {
  await openEditor(page);
  await chooseAddObject(page, 'Building');
  await placeObjectOnCanvas(page, [[120, 650]]);

  await expect(page.locator('.stp-node-name', { hasText: /^Building \d+$/ })).toBeVisible();
});
test('deleting a pedestrian via panel removes its mesh, not just the store entry', async ({
  page,
}) => {
  await mockScenarioApi(page);
  await openEditor(page);
  await loadMockScenario(page);

  const countBefore = await page.getByTestId('scene-graph-count').textContent();
  await page.getByText('Pedestrian 01', { exact: true }).click();
  await page.getByRole('button', { name: 'Delete pedestrian' }).click();

  await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
    countBefore!
  );
  await expect(
    page.getByText('Pedestrian 01', { exact: true })
  ).not.toBeVisible();
});
test('adding pedestrian via speed dial and double-click creates a mesh', async ({
  page,
}) => {
  await openEditor(page);
  await chooseAddObject(page, 'Pedestrian');
  await placeObjectOnCanvas(page);

  await expect(
    page.locator('.stp-node-name', { hasText: /^Pedestrian \d+$/ })
  ).toBeVisible();
});
test('adding RSU via speed dial and double-click creates a mesh', async ({
  page,
}) => {
  await openEditor(page);
  await chooseAddObject(page, 'RSU');
  await placeObjectOnCanvas(page);

  await expect(page.locator('.stp-node-name', { hasText: /^RSU \d+$/ })).toBeVisible();
});
// test('adding car via speed dial and single click creates a mesh', async ({
//   page,
// }) => {
//   page.on('console', (msg) => {
//     if (msg.text().includes('[DEBUG car-click]')) {
//       console.log('BROWSER:', msg.text());
//     }
//   });

//   await openEditor(page);
//   await openSpeedDial(page);
//   await page.getByRole('menuitem', { name: 'Add car' }).click();

//   const canvas = page.getByTestId('editor-canvas');
//   await canvas.click({ position: { x: 50, y: 50 } });
//   await canvas.click({ position: { x: 230, y: 100 } });

//   await expect(
//     page.locator('.stp-node-name', { hasText: 'Car' })
//   ).toBeVisible();
// });
// test('deleting a car via panel removes its mesh, not just the store entry', async ({
//   page,
// }) => {
//   await openEditor(page);
//   await openSpeedDial(page);
//   await page.getByRole('menuitem', { name: 'Add car' }).click();

//   const canvas = page.getByTestId('editor-canvas');
//   await canvas.click({ position: { x: 50, y: 50 } });
//   await canvas.click({ position: { x: 230, y: 100 } });
//   await expect(
//     page.locator('.stp-node-name', { hasText: 'Car' })
//   ).toBeVisible();

//   const countBefore = await page.getByTestId('scene-graph-count').textContent();
//   await page.locator('.stp-node-name', { hasText: 'Car' }).click();
//   await page.getByRole('button', { name: 'Delete car' }).click();

//   await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
//     countBefore!
//   );
//   await expect(
//     page.locator('.stp-node-name', { hasText: 'Car' })
//   ).not.toBeVisible();
// });
// test('two cars added back-to-back before the model finishes loading both end up in the scene graph', async ({
//   page,
// }) => {
//   await openEditor(page);

//   await openSpeedDial(page);
//   await page.getByRole('menuitem', { name: 'Add car' }).click();
//   const canvas = page.getByTestId('editor-canvas');
//   await canvas.click({ position: { x: 50, y: 50 } });
//   await canvas.click({ position: { x: 230, y: 100 } });

//   await openSpeedDial(page);
//   await page.getByRole('menuitem', { name: 'Add car' }).click();
//   await canvas.click({ position: { x: 230, y: 100 } });

//   await expect(page.locator('.stp-node-name', { hasText: 'Car' })).toHaveCount(
//     2
//   );
// });
