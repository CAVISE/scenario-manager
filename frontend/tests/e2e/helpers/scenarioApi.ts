import type { Page } from '@playwright/test';

export type ScenarioListEntry = {
  id: number;
  scenario_id: string;
  name: string;
  annotation?: string | null;
};

export async function mockScenarioList(
  page: Page,
  scenarios: ScenarioListEntry[]
) {
  await page.route('**/api/v1/scenarios?*', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        items: scenarios,
        total: scenarios.length,
        offset: 0,
        limit: 100,
      }),
    })
  );
}
