import { expect, test } from '@playwright/test';

test.describe('authentication gate', () => {
  test('signs an unauthenticated user in and opens the workspace', async ({
    page,
  }) => {
    let signedIn = false;

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: signedIn ? 200 : 401,
        contentType: 'application/json',
        body: signedIn
          ? JSON.stringify({
              email: 'operator@example.test',
              role: 'operator',
              authentication_enabled: true,
            })
          : JSON.stringify({ detail: 'Authentication required' }),
      })
    );
    await page.route('**/api/auth/login', async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        email: 'operator@example.test',
        password: 'correct-password',
      });
      signedIn = true;
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'test-token',
          token_type: 'bearer',
          expires_in: 3600,
        }),
      });
    });
    await page.route('**/api/v1/scenarios?*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0, offset: 0, limit: 100 }),
      })
    );

    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: 'Scenario Manager' })
    ).toBeVisible();

    await page.getByLabel('Email').fill('operator@example.test');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await expect(page.getByText('operator@example.test')).toBeVisible();
  });

  test('shows an actionable error for invalid credentials', async ({
    page,
  }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 401,
        body: JSON.stringify({ detail: 'Required' }),
      })
    );
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        body: JSON.stringify({ detail: 'Invalid' }),
      })
    );

    await page.goto('/');
    await page.getByLabel('Email').fill('operator@example.test');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Invalid email or password.'
    );
  });
});
