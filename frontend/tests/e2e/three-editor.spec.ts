import {
  expect,
  expectScenarioObjects,
  loadScenario,
  objectNames,
  openAddObject,
  openEditor,
  openScenarioPicker,
  placeObject,
  showSceneObjects,
  test,
  undoButton,
} from './fixtures';

test.describe('Three.js editor flows', () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
  });

  test('initializes editor scene and side panels', async ({ page }) => {
    await expect(page.getByTestId('editor-canvas')).toBeVisible();
    await expect(page.getByTestId('transform-controls')).toBeVisible();
    await expect(
      page.getByRole('tab', { name: 'Edit', exact: true })
    ).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByText('Inspector', { exact: true })).toBeVisible();
    await expect(
      page.getByText('Select an object', { exact: true })
    ).toBeVisible();
    await showSceneObjects(page);
    await expect(objectNames(page)).toHaveCount(0);
  });

  test('requires a selection before transforming and switches transform modes', async ({
    page,
  }) => {
    const translate = page.getByRole('button', { name: 'Transform translate' });
    const rotate = page.getByRole('button', { name: 'Transform rotate' });
    const scale = page.getByRole('button', { name: 'Transform scale' });
    await expect(translate).toBeDisabled();
    await expect(rotate).toBeDisabled();
    await expect(scale).toBeDisabled();

    await loadScenario(page);
    await objectNames(page, /^Building\b/i).click();
    await expect(translate).toBeEnabled();
    await expect(translate).toHaveAttribute('aria-pressed', 'true');
    await rotate.click();
    await expect(rotate).toHaveAttribute('aria-pressed', 'true');
    await expect(translate).toHaveAttribute('aria-pressed', 'false');
    await scale.click();
    await expect(scale).toHaveAttribute('aria-pressed', 'true');
    await expect(rotate).toHaveAttribute('aria-pressed', 'false');

    await page.keyboard.press('Escape');
    await expect(translate).toBeDisabled();
    await expect(rotate).toBeDisabled();
    await expect(scale).toBeDisabled();
  });

  test('shows object actions and enables waypoints only for a selected vehicle', async ({
    page,
  }) => {
    await openAddObject(page);
    for (const name of ['Vehicle', 'RSU', 'Building', 'Pedestrian']) {
      await expect(
        page.getByRole('menuitem', { name, exact: true })
      ).toBeVisible();
    }
    await expect(
      page.getByRole('menuitem', { name: /Waypoint/ })
    ).toBeDisabled();
    await page.keyboard.press('Escape');

    await loadScenario(page);
    await objectNames(page, /^(Car|Vehicle)\b/i).click();
    await openAddObject(page);
    await expect(
      page.getByRole('menuitem', { name: 'Waypoint', exact: true })
    ).toBeEnabled();
  });

  test('opens and closes the scenario picker from the file menu', async ({
    page,
  }) => {
    await openScenarioPicker(page);
    await page.getByRole('button', { name: 'close', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Load Scenario' })
    ).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'File menu', exact: true })
    ).toBeEnabled();
  });

  test('loads a scenario and updates its name and scene graph', async ({
    page,
  }) => {
    await loadScenario(page);
    await expect(page.locator('.editor-scenario-name')).toHaveText(
      'Mock scenario'
    );
    await expectScenarioObjects(page);
  });

  test('clears a loaded scene only after confirmation', async ({ page }) => {
    await loadScenario(page);
    const actions = page.getByRole('button', { name: 'Scene actions' });
    await actions.click();
    await page
      .getByRole('menuitem', { name: 'Clear scene…', exact: true })
      .click();
    const confirmation = page.getByRole('dialog', { name: 'Clear scene?' });
    await expect(confirmation).toBeVisible();
    await expectScenarioObjects(page);
    await confirmation
      .getByRole('button', { name: 'Cancel', exact: true })
      .click();
    await expectScenarioObjects(page);

    await actions.click();
    await page
      .getByRole('menuitem', { name: 'Clear scene…', exact: true })
      .click();
    await confirmation
      .getByRole('button', { name: 'Clear scene', exact: true })
      .click();
    await expect(confirmation).toBeHidden();
    await expect(objectNames(page)).toHaveCount(0);
    await expect(undoButton(page)).toBeEnabled();
    await undoButton(page).click();
    await expectScenarioObjects(page);
  });

  test('loading a scenario with a building renders it in the scene graph', async ({
    page,
  }) => {
    await loadScenario(page);
    await expect(objectNames(page, /^Building\b/i)).toHaveCount(1);
    await objectNames(page, /^Building\b/i).click();
    await expect(
      page.getByRole('button', { name: 'Delete building', exact: true })
    ).toBeEnabled();
  });

  test('deleting a building removes it from the scene graph and undo restores it', async ({
    page,
  }) => {
    await loadScenario(page);
    const countBefore = await objectNames(page).count();
    await objectNames(page, /^Building\b/i).click();
    await page
      .getByRole('button', { name: 'Delete building', exact: true })
      .click();
    await expect(objectNames(page, /^Building\b/i)).toHaveCount(0);
    await expect(objectNames(page)).toHaveCount(countBefore - 1);
    await expect(objectNames(page, /^Pedestrian\b/i)).toHaveCount(1);
    await expect(objectNames(page, /^RSU\b/i)).toHaveCount(1);
    await undoButton(page).click();
    await expectScenarioObjects(page);
  });

  test('reloading a scenario does not duplicate scene objects', async ({
    page,
  }) => {
    await loadScenario(page);
    const before = await objectNames(page).allTextContents();
    await loadScenario(page);
    await expectScenarioObjects(page);
    await expect(objectNames(page)).toHaveCount(before.length);
  });

  test('adds a building from Add object with a canvas double click', async ({
    page,
  }) => {
    await placeObject(page, 'Building');
    await expect(objectNames(page, /^Building\b/i)).toHaveCount(1);
  });

  test('deleting a pedestrian removes it from the scene graph and undo restores it', async ({
    page,
  }) => {
    await loadScenario(page);
    const countBefore = await objectNames(page).count();
    await objectNames(page, /^Pedestrian\b/i).click();
    await page
      .getByRole('button', { name: 'Delete pedestrian', exact: true })
      .click();
    await expect(objectNames(page, /^Pedestrian\b/i)).toHaveCount(0);
    await expect(objectNames(page)).toHaveCount(countBefore - 1);
    await expect(objectNames(page, /^Building\b/i)).toHaveCount(1);
    await expect(objectNames(page, /^RSU\b/i)).toHaveCount(1);
    await undoButton(page).click();
    await expectScenarioObjects(page);
  });

  test('adds a pedestrian from Add object with a canvas double click', async ({
    page,
  }) => {
    await placeObject(page, 'Pedestrian');
    await expect(objectNames(page, /^Pedestrian\b/i)).toHaveCount(1);
  });

  test('adds an RSU from Add object with a canvas double click', async ({
    page,
  }) => {
    await placeObject(page, 'RSU');
    await expect(objectNames(page, /^RSU\b/i)).toHaveCount(1);
  });
});
