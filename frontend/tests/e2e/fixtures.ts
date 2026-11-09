import { expect, test as base } from '@playwright/test';

export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          login: 'operator',
          role: 'operator',
          authentication_enabled: true,
        }),
      })
    );

    await provide(page);
  },
});

export { expect };
