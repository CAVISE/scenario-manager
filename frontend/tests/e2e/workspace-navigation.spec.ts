import { expect, test } from './fixtures';
import { mockScenarioList } from './helpers/scenarioApi';

test.describe('workspace scenario library', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/ws/simulation', (route) => route.abort());
    await mockScenarioList(page, [
      {
        id: 2,
        scenario_id: 'rainy-crossing',
        name: 'Rainy crossing',
        annotation: 'GNSS resilience experiment',
      },
      {
        id: 1,
        scenario_id: 'urban-baseline',
        name: 'Urban baseline',
        annotation: 'Reference route',
      },
    ]);
  });

  test('filters the scenario library and opens the selected scenario', async ({
    page,
  }) => {
    await page.goto('/scenarios');

    await expect(
      page.getByRole('heading', { name: 'Scenarios' })
    ).toBeVisible();
    await expect(page.getByText('2 scenarios')).toBeVisible();
    await expect(page.getByText('Rainy crossing')).toBeVisible();

    await page
      .getByRole('searchbox', { name: 'Search scenarios' })
      .fill('urban');
    await expect(page.getByText('1 scenarios matching “urban”')).toBeVisible();
    await expect(page.getByText('Rainy crossing')).not.toBeVisible();

    await page.getByText('Urban baseline').click();
    await expect(page).toHaveURL(/\/editor\?scenario=urban-baseline/);
  });
});
