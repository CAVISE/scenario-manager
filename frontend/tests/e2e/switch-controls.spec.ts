import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/ws/simulation', (route) => route.abort());
});
test('CARLA synchronous mode can be toggled off and back on', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('open-editor').click();
  await expect(page).toHaveURL(/\/editor$/);

  await page.getByTestId('SettingsIcon').locator('..').click();
  await page.getByRole('tab', { name: 'CARLA' }).dispatchEvent('click');

  const synchronousMode = page.getByRole('checkbox', {
    name: 'Synchronous Mode',
  });
  await expect(synchronousMode).toBeChecked();

  await synchronousMode.dispatchEvent('click');
  await expect(synchronousMode).not.toBeChecked();

  await synchronousMode.dispatchEvent('click');
  await expect(synchronousMode).toBeChecked();
});
