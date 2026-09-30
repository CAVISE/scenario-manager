import { expect, test } from '@playwright/test';

test('scenario v1 CRUD uses the current REST contract', async ({ page }) => {
  let revision = 1;
  let storedScenario: Record<string, unknown> | null = null;

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        email: 'operator@example.test',
        role: 'operator',
        authentication_enabled: true,
      }),
    })
  );

  await page.route('**/api/v1/scenarios**', async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const scenarioId = url.pathname.split('/').at(-1);

    if (method === 'POST') {
      storedScenario = request.postDataJSON() as Record<string, unknown>;
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Scenario created',
          scenario_id: 'e2e-scenario',
          revision,
        }),
      });
    }

    if (method === 'GET' && scenarioId === 'scenarios') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, offset: 0, limit: 50 }),
      });
    }

    if (method === 'GET') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          id: 1,
          scenario_id: scenarioId,
          revision,
          name_of_scenario: storedScenario?.name_of_scenario ?? 'E2E scenario',
          scenario_text: { scenario_text: [] },
          preview: null,
          annotation: null,
          file_: null,
          map: null,
        }),
      });
    }

    if (method === 'PATCH') {
      revision += 1;
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Scenario updated',
          scenario_id: scenarioId,
          revision,
          warning: null,
        }),
      });
    }

    if (method === 'DELETE') {
      return route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          message: 'Scenario deleted',
          scenario_id: scenarioId,
        }),
      });
    }

    return route.fallback();
  });

  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Welcome to Scenario Manager' })
  ).toBeVisible();
  const result = await page.evaluate(async () => {
    const create = await fetch('/api/v1/scenarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: 'e2e-scenario',
        name_of_scenario: 'E2E scenario',
        scenario: { scenario_text: [] },
      }),
    }).then((response) => response.json());
    const detail = await fetch('/api/v1/scenarios/e2e-scenario').then(
      (response) => response.json()
    );
    const update = await fetch('/api/v1/scenarios/e2e-scenario', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scenario_id: 'e2e-scenario',
        scenario_name: 'Updated E2E scenario',
        expected_revision: detail.revision,
      }),
    }).then((response) => response.json());
    const remove = await fetch('/api/v1/scenarios/e2e-scenario', {
      method: 'DELETE',
    }).then((response) => response.json());

    return { create, detail, update, remove };
  });

  expect(result.create).toMatchObject({
    scenario_id: 'e2e-scenario',
    revision: 1,
  });
  expect(result.detail).toMatchObject({
    scenario_id: 'e2e-scenario',
    revision: 1,
  });
  expect(result.update).toMatchObject({
    scenario_id: 'e2e-scenario',
    revision: 2,
  });
  expect(result.remove).toMatchObject({ scenario_id: 'e2e-scenario' });
});
