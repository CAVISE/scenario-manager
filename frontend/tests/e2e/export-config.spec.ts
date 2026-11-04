import { expect, test } from './fixtures';

test.describe('configuration export', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/ws/simulation', (route) => route.abort());
  });

  test('previews and downloads a CARLA configuration artifact', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('open-editor').click();
    await expect(page).toHaveURL(/\/editor$/);
    await expect(page.locator('.sm-loader-root')).toHaveCount(0, {
      timeout: 30_000,
    });

    await page.getByRole('button', { name: 'Export configuration' }).click();
    await page.getByRole('menuitem', { name: 'CARLA (.yaml)' }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'File name' })).toHaveValue(
      'carla_config.yaml'
    );

    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download' }).click();
    const artifact = await download;

    expect(artifact.suggestedFilename()).toBe('carla_config.yaml');
  });
});
