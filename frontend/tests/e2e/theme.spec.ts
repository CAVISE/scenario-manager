import type { Locator, Page } from '@playwright/test';
import {
  expect,
  loadScenario,
  objectNames,
  openEditor,
  openScenarioPicker,
  scenarioSummary,
  test,
} from './fixtures';

type ThemeMode = 'light' | 'dark';

async function selectTheme(page: Page, mode: ThemeMode | 'system') {
  await page.goto('/settings');
  await page.getByRole('combobox').selectOption(mode);
}

async function expectTheme(page: Page, mode: ThemeMode) {
  await expect(page.locator('html')).toHaveAttribute('data-theme', mode);
}

async function expectColorToken(
  locator: Locator,
  property: 'color' | 'background-color' | 'border-right-color',
  token: string,
  pseudo?: '::placeholder'
) {
  await expect(locator).toBeVisible();
  const expected = await locator.evaluate((_, token) => {
    const probe = document.createElement('span');
    probe.style.color = `var(${token})`;
    probe.hidden = true;
    document.body.append(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }, token);
  await expect
    .poll(
      () =>
        locator.evaluate(
          (element, { property, pseudo }) =>
            getComputedStyle(element, pseudo).getPropertyValue(property),
          { property, pseudo }
        ),
      { message: `${property} should resolve to ${token} on ${locator}` }
    )
    .toBe(expected);
}

async function attachComponent(name: string, component: Locator) {
  await expect(component).toBeVisible();
  await test.info().attach(name, {
    body: await component.screenshot({
      path: test.info().outputPath(`${name}.png`),
      animations: 'disabled',
      caret: 'hide',
      style:
        '[data-testid="editor-canvas"] canvas { visibility: hidden !important; }',
    }),
    contentType: 'image/png',
  });
}

test('theme choice survives reload and explicit themes override the system', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await selectTheme(page, 'dark');
  await expectTheme(page, 'dark');
  await page.reload();
  await expectTheme(page, 'dark');
  await expect(page.getByRole('combobox')).toHaveValue('dark');

  await page.emulateMedia({ colorScheme: 'dark' });
  await page.getByRole('combobox').selectOption('light');
  await expectTheme(page, 'light');
  await page.reload();
  await expectTheme(page, 'light');
  await expect(page.getByRole('combobox')).toHaveValue('light');
});

test('System theme follows browser color scheme changes and survives reload', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await selectTheme(page, 'system');
  await expectTheme(page, 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expectTheme(page, 'light');
  await page.reload();
  await expect(page.getByRole('combobox')).toHaveValue('system');
  await expectTheme(page, 'light');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expectTheme(page, 'dark');
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
]) {
  for (const mode of ['light', 'dark'] as const) {
    test(`${mode} surfaces and controls at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await selectTheme(page, mode);
      await expectTheme(page, mode);
      await expectColorToken(
        page.locator('.workspace-shell'),
        'background-color',
        '--workspace-bg'
      );
      await attachComponent(
        `settings-${mode}-${viewport.width}`,
        page.locator('.workspace-shell')
      );

      await page.goto('/');
      await expectTheme(page, mode);
      await expectColorToken(
        page.locator('.workspace-kicker'),
        'color',
        '--workspace-muted'
      );
      await expectColorToken(
        page.getByTestId('open-editor'),
        'background-color',
        '--workspace-surface'
      );
      await expectColorToken(
        page.locator('.workspace-section-heading').getByRole('link'),
        'color',
        '--workspace-accent'
      );
      await attachComponent(
        `home-${mode}-${viewport.width}`,
        page.locator('.workspace-shell')
      );

      await page.goto('/scenarios');
      const scenarioCard = page.getByRole('button', { name: /Mock scenario/ });
      await expect(scenarioCard).toBeVisible();
      await expectColorToken(
        scenarioCard,
        'background-color',
        '--workspace-surface'
      );
      await expectColorToken(
        page.locator('.workspace-map-placeholder'),
        'color',
        '--workspace-accent'
      );
      await expectColorToken(
        page.getByPlaceholder('Search scenarios…'),
        'color',
        '--workspace-muted',
        '::placeholder'
      );
      await attachComponent(
        `scenarios-${mode}-${viewport.width}`,
        page.locator('.workspace-shell')
      );

      await openEditor(page);
      await expectTheme(page, mode);
      await expectColorToken(
        page.locator('.editor-command-bar'),
        'background-color',
        '--workspace-surface'
      );
      await expectColorToken(
        page.locator('.rp-root'),
        'background-color',
        '--workspace-surface'
      );
      await attachComponent(
        `editor-toolbar-${mode}-${viewport.width}`,
        page.locator('.editor-command-bar')
      );

      await openScenarioPicker(page);
      const picker = page.getByRole('dialog', {
        name: 'Load Scenario',
        exact: true,
      });
      const card = picker.getByRole('button', { name: /Mock scenario/ });
      await expectColorToken(picker, 'background-color', '--workspace-surface');
      await expectColorToken(
        picker.getByRole('heading', { name: 'Load Scenario' }),
        'color',
        '--workspace-text'
      );
      await expectColorToken(card, 'background-color', '--workspace-surface');
      const backgroundBeforeHover = await card.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      );
      await card.hover();
      await expect
        .poll(() =>
          card.evaluate((element) => getComputedStyle(element).backgroundColor)
        )
        .not.toBe(backgroundBeforeHover);
      await picker.getByRole('button', { name: 'close', exact: true }).focus();
      await page.keyboard.press('Tab');
      // Focus is trapped by the modal, including at the keyboard boundary.
      await expect
        .poll(() =>
          picker.evaluate((element) => element.contains(document.activeElement))
        )
        .toBe(true);
      await attachComponent(
        `scenario-picker-${mode}-${viewport.width}`,
        picker
      );

      await card.click();
      const description = picker.getByRole('textbox', {
        name: /description|annotation/i,
      });
      await expect(description).toHaveValue(scenarioSummary.annotation);
      await expectColorToken(description, 'color', '--workspace-text');
      const save = picker.getByRole('button', { name: /Save/i });
      await expect(save).toBeDisabled();
      await description.fill('Updated description');
      await expect(save).toBeEnabled();
      await description.fill(scenarioSummary.annotation);
      await expect(save).toBeDisabled();
      await expectColorToken(
        picker.getByRole('button', { name: 'Load onto scene', exact: true }),
        'color',
        '--workspace-on-accent'
      );
      await attachComponent(
        `scenario-detail-${mode}-${viewport.width}`,
        picker
      );
      await picker.getByRole('button', { name: 'close', exact: true }).click();

      await page
        .getByRole('button', { name: 'Simulation settings', exact: true })
        .click();
      const settings = page.getByRole('dialog', {
        name: 'Simulation settings',
        exact: true,
      });
      await settings.getByRole('tab', { name: 'CARLA', exact: true }).click();
      await expectColorToken(
        settings,
        'background-color',
        '--workspace-surface'
      );
      await expectColorToken(settings, 'color', '--workspace-text');
      await expect(
        settings.getByRole('checkbox', { name: 'Synchronous Mode' })
      ).toBeChecked();
      await attachComponent(
        `simulation-settings-${mode}-${viewport.width}`,
        settings
      );
      await settings
        .getByRole('button', { name: 'Close', exact: true })
        .click();
    });

    test(`${mode} selected objects, menus and confirmation at ${viewport.width}×${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await selectTheme(page, mode);
      await openEditor(page);
      await loadScenario(page);
      await objectNames(page, /^Building\b/i).click();
      const selectedRow = page
        .getByRole('treeitem', { checked: true })
        .locator('> .MuiTreeItem-content');
      await expectColorToken(
        selectedRow,
        'background-color',
        '--workspace-accent-soft'
      );
      await expectColorToken(
        objectNames(page, /^Building\b/i),
        'color',
        '--workspace-text'
      );
      await selectedRow.hover();
      await expectColorToken(
        selectedRow,
        'background-color',
        '--workspace-accent-soft'
      );
      await expectColorToken(
        page.getByRole('searchbox', { name: 'Search scene objects' }),
        'color',
        '--workspace-muted',
        '::placeholder'
      );
      if (mode === 'dark') {
        await expectColorToken(
          page.getByText('HMN', { exact: true }),
          'color',
          '--workspace-object-pedestrian'
        );
      }
      await expect(
        page.getByRole('button', { name: 'Transform translate' })
      ).toHaveAttribute('aria-pressed', 'true');
      const remove = page.getByRole('button', {
        name: 'Delete building',
        exact: true,
      });
      await expect(remove).toBeEnabled();
      await expectColorToken(remove, 'color', '--workspace-danger-action');
      const normalBackground = await remove.evaluate(
        (element) => getComputedStyle(element).backgroundColor
      );
      await remove.hover();
      await expect
        .poll(() =>
          remove.evaluate(
            (element) => getComputedStyle(element).backgroundColor
          )
        )
        .not.toBe(normalBackground);
      await expectColorToken(remove, 'color', '--workspace-danger-action');
      await remove.focus();
      await expect(remove).toBeFocused();
      await attachComponent(
        `inspector-selected-${mode}-${viewport.width}`,
        page.locator('.rp-root')
      );
      await attachComponent(
        `editor-${mode}-${viewport.width}`,
        page.getByTestId('editor-workspace')
      );

      await page
        .getByRole('button', { name: 'File menu', exact: true })
        .click();
      const menu = page.getByRole('menu').locator('..');
      await expectColorToken(menu, 'background-color', '--workspace-surface');
      await attachComponent(`file-menu-${mode}-${viewport.width}`, menu);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('menu', { includeHidden: true })).toHaveCount(
        0
      );

      await page.getByRole('button', { name: 'Scene actions' }).click();
      await page
        .getByRole('menuitem', { name: 'Clear scene…', exact: true })
        .click();
      const confirmation = page.getByRole('dialog', { name: 'Clear scene?' });
      await expectColorToken(
        confirmation,
        'background-color',
        '--workspace-surface'
      );
      await expectColorToken(confirmation, 'color', '--workspace-text');
      await attachComponent(
        `clear-confirmation-${mode}-${viewport.width}`,
        confirmation
      );
      await confirmation
        .getByRole('button', { name: 'Cancel', exact: true })
        .click();
      await expect(objectNames(page)).toHaveCount(4);
    });
  }
}

test('scenario list errors remain readable in dark mode', async ({ page }) => {
  await selectTheme(page, 'dark');
  await openEditor(page);
  await page.route('**/api/load_all_scenarios', (route) =>
    route.fulfill({
      status: 500,
      json: { detail: 'The scenario service is unavailable.' },
    })
  );
  await openScenarioPicker(page);
  const picker = page.getByRole('dialog', {
    name: 'Load Scenario',
    exact: true,
  });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('alert')).toBeVisible();
  await expectColorToken(
    picker.getByRole('alert'),
    'color',
    '--workspace-danger'
  );
  await attachComponent('scenario-load-error-dark', picker);
});
