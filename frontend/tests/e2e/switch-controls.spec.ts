import { expect, openEditor, test } from './fixtures';
test('CARLA synchronous mode can be toggled off and back on', async ({
  page,
}) => {
  await openEditor(page);
  await page
    .getByRole('button', { name: 'Simulation settings', exact: true })
    .click();
  await page.getByRole('tab', { name: 'CARLA' }).click();

  const synchronousMode = page.getByRole('checkbox', {
    name: 'Synchronous Mode',
  });
  await expect(synchronousMode).toBeChecked();

  await synchronousMode.click();
  await expect(synchronousMode).not.toBeChecked();

  await synchronousMode.click();
  await expect(synchronousMode).toBeChecked();

  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await page
    .getByRole('button', { name: 'Simulation settings', exact: true })
    .click();
  await page.getByRole('tab', { name: 'CARLA', exact: true }).click();
  await expect(synchronousMode).toBeChecked();
});
