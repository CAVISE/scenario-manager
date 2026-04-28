import { expect, test, type Page } from '@playwright/test';

const openEditor = async (page: Page) => {
  await page.goto('/');
  await page.getByRole('link', { name: /Open Editor/i }).click();
  await expect(page).toHaveURL(/\/editor$/);
  await expect(page.getByText('Scene Graph')).toBeVisible();
};

const openSpeedDial = async (page: Page) => {
  const dial = page.locator('[aria-label="SpeedDial tooltip example"]');
  await dial.click();
};

const mockScenarioApi = async (page: Page) => {
  await page.route('**/api/load_all_scenarios', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        count: 1,
        scenarios: [
          {
            id: 1,
            scenario_id: 'mock-1',
            name: 'Mock scenario',
            preview: null,
            annotation: 'e2e generated',
          },
        ],
      }),
    });
  });

  await page.route('**/api/load_scenario/mock-1', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        status: 'success',
        scenario: {
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
          ],
        },
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
    await expect(page.getByText('scene is empty')).toBeVisible();
  });

  test('switches transform modes', async ({ page }) => {
    await openEditor(page);

    const translate = page.getByTestId('transform-translate');
    const rotate = page.getByTestId('transform-rotate');
    const scale = page.getByTestId('transform-scale');

    await expect(translate).toHaveClass(/MuiIconButton-colorPrimary/);
    await rotate.click();
    await expect(rotate).toHaveClass(/MuiIconButton-colorPrimary/);
    await scale.click();
    await expect(scale).toHaveClass(/MuiIconButton-colorPrimary/);
  });

  test('shows object actions in speed dial', async ({ page }) => {
    await openEditor(page);
    await openSpeedDial(page);
    await expect(page.getByRole('menuitem', { name: 'Add waypoint' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Add car' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Add RSU' })).toBeVisible();
    await expect(
      page.getByRole('menuitem', { name: 'Add a pedestrian' }),
    ).toBeVisible();
  });

  test('opens upload modal from toolbar menu', async ({ page }) => {
    await openEditor(page);
    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('menuitem', { name: 'Upload' }).click();
    await expect(
      page.getByRole('heading', { name: 'Load Scenario' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'close' }).click();
    await expect(
      page.getByRole('heading', { name: 'Load Scenario' }),
    ).not.toBeVisible();
  });

  test('loads scenario from upload modal and updates scene graph', async ({
    page,
  }) => {
    await mockScenarioApi(page);
    await openEditor(page);

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('menuitem', { name: 'Upload' }).click();
    await page.getByText('Mock scenario').click();
    await page.getByRole('button', { name: 'Load onto scene' }).click();

    await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
      '0 objects',
    );
    await expect(
      page.getByText('The script has been uploaded.').first(),
    ).toBeVisible();
  });

  test('clears scene after loaded scenario', async ({ page }) => {
    await mockScenarioApi(page);
    await openEditor(page);

    await page.getByRole('button', { name: 'Menu' }).click();
    await page.getByRole('menuitem', { name: 'Upload' }).click();
    await page.getByText('Mock scenario').click();
    await page.getByRole('button', { name: 'Load onto scene' }).click();
    await expect(page.getByTestId('scene-graph-count')).not.toHaveText(
      '0 objects',
    );
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Clear all' }).click();
    await expect(page.getByTestId('scene-graph-count')).toHaveText('0 objects');
    await expect(page.getByText('scene is empty')).toBeVisible();
  });
});
