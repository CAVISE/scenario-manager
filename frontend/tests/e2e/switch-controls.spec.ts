import { expect, test } from './fixtures';
test.beforeEach(async ({ page }) => {
  await page.route('**/api/ws/simulation', (route) => route.abort());
});
test('CARLA synchronous mode can be toggled off and back on', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByTestId('open-editor').click();
  await expect(page).toHaveURL(/\/editor$/);

  await page.getByRole('button', { name: 'Simulation settings' }).click();
  await page.getByRole('tab', { name: 'CARLA' }).click();

  const synchronousMode = page.getByRole('switch', {
    name: 'Synchronous Mode',
  });
  await expect(synchronousMode).toBeChecked();

  await synchronousMode.click();
  await expect(synchronousMode).not.toBeChecked();

  await synchronousMode.click();
  await expect(synchronousMode).toBeChecked();
});
