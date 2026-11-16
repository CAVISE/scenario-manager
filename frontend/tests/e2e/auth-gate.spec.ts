import { expect, test } from '@playwright/test';

test.describe('authentication gate', () => {
  test('signs in by login and blocks protected pages after logout', async ({
    page,
  }) => {
    let signedIn = false;

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: signedIn ? 200 : 401,
        contentType: 'application/json',
        body: signedIn
          ? JSON.stringify({
              login: 'operator',
              role: 'operator',
              authentication_enabled: true,
            })
          : JSON.stringify({ detail: 'Authentication required' }),
      })
    );
    await page.route('**/api/auth/login', async (route) => {
      expect(route.request().postDataJSON()).toEqual({
        login: 'operator',
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
    await page.route('**/api/auth/logout', async (route) => {
      signedIn = false;
      await route.fulfill({ status: 204 });
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

    await page.getByLabel('login').fill('operator');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(
      page.getByRole('heading', { name: 'Dashboard' })
    ).toBeVisible();
    await expect(page.getByText('operator', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: /operator.*Sign out/ }).click();
    await expect(
      page.getByRole('button', { name: 'Sign in', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeHidden();

    await page.goto('/scenarios');
    await expect(page.getByLabel('Login', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Main navigation' })
    ).toBeHidden();
  });

  test('explains invalid credentials or a disabled account', async ({
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
    await page.getByLabel('login').fill('operator');
    await page.getByLabel('Password').fill('wrong-password');
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page.getByRole('alert')).toHaveText(
      'Invalid login or password, or the account is disabled. Check your credentials or contact an administrator.'
    );
  });

  test('keeps the login after a network failure and allows retry', async ({
    page,
  }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, body: '{}' })
    );
    let attempts = 0;
    await page.route('**/api/auth/login', (route) => {
      attempts += 1;
      expect(route.request().postDataJSON()).toEqual({
        login: 'Operator_42',
        password: 'correct-password',
      });
      return attempts === 1
        ? route.abort('failed')
        : route.fulfill({ status: 401, body: '{}' });
    });

    await page.goto('/');
    await page.getByLabel('Login', { exact: true }).fill('Operator_42');
    await page.getByLabel('Password').fill('correct-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Unable to connect. Check your network connection and try again.'
    );
    await expect(page.getByLabel('Login', { exact: true })).toHaveValue(
      'Operator_42'
    );
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Invalid login or password, or the account is disabled. Check your credentials or contact an administrator.'
    );
    expect(attempts).toBe(2);
  });

  test('submits a backend-valid Unicode password without truncation', async ({
    page,
  }) => {
    // Pydantic counts code points; HTML maxLength counts UTF-16 code units.
    const password = 'a'.repeat(255) + '🔐';
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, body: '{}' })
    );
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({ status: 401, body: '{}' })
    );
    await page.goto('/');
    await page.getByLabel('Login', { exact: true }).fill('operator');
    await page.getByLabel('Password').fill(password);
    const request = page.waitForRequest('**/api/auth/login');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    expect((await request).postDataJSON()).toEqual({
      login: 'operator',
      password,
    });
  });

  test('rejects email addresses and short logins before sending credentials', async ({
    page,
  }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 401, body: '{}' })
    );
    const requests: string[] = [];
    await page.route('**/api/auth/login', (route) => {
      requests.push(route.request().postData() ?? '');
      return route.fulfill({ status: 401, body: '{}' });
    });

    await page.goto('/');
    await page.getByLabel('Password').fill('correct-password');
    const loginInput = page.getByLabel('Login', { exact: true });
    for (const invalidLogin of ['operator@example.com', 'ab']) {
      await loginInput.fill(invalidLogin);
      await page.getByRole('button', { name: 'Sign in', exact: true }).click();
      expect(
        await loginInput.evaluate((input: HTMLInputElement) =>
          input.checkValidity()
        )
      ).toBe(false);
    }
    await loginInput.fill('operator_42');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(requests).toHaveLength(1);
  });
});
