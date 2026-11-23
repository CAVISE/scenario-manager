import { expect, test, type Page } from '@playwright/test';

async function session(
  page: Page,
  role = 'admin',
  authentication_enabled = true
) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { login: 'admin', role, authentication_enabled } })
  );
}
const accounts = [
  {
    id: 1,
    login: 'admin',
    role: 'admin',
    is_admin: true,
    is_active: true,
  },
  {
    id: 2,
    login: 'researcher',
    role: 'viewer',
    is_admin: false,
    is_active: true,
  },
];

test('edits a user and toggles password visibility', async ({ page }) => {
  await session(page);
  let edited = false;
  await page.route('**/api/auth/users', (route) =>
    route.fulfill({
      json: edited
        ? [
            accounts[0],
            {
              ...accounts[1],
              login: 'renamed_researcher',
              role: 'operator',
            },
          ]
        : accounts,
    })
  );
  await page.route('**/api/auth/users/2', (route) => {
    expect(route.request().method()).toBe('PATCH');
    expect(route.request().postDataJSON()).toEqual({
      login: 'renamed_researcher',
      role: 'operator',
    });
    edited = true;
    return route.fulfill({
      json: {
        ...accounts[1],
        login: 'renamed_researcher',
        role: 'operator',
      },
    });
  });

  await page.goto('/users');
  await page.getByRole('button', { name: 'Edit researcher' }).click();
  const editDialog = page.getByRole('dialog');
  await editDialog
    .getByLabel('Login', { exact: true })
    .fill('renamed_researcher');
  await editDialog.locator('select').selectOption('operator');
  await editDialog.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('status')).toHaveText('User updated.');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  await expect(page.getByRole('status')).toHaveCount(0);
  await expect(
    page.getByRole('rowheader', { name: 'renamed_researcher' })
  ).toBeVisible();

  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  const createDialog = page.getByRole('dialog');
  const password = createDialog.getByLabel('New password', { exact: true });
  await expect(password).toHaveAttribute('type', 'password');
  await createDialog.getByRole('button', { name: 'Show new password' }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await createDialog.getByRole('button', { name: 'Hide new password' }).click();
  await expect(password).toHaveAttribute('type', 'password');
});

test('restricts direct user-management access and hides navigation for non-admins', async ({
  page,
}) => {
  await session(page, 'viewer');
  let requests = 0;
  await page.route('**/api/auth/users', (route) => {
    requests++;
    return route.fulfill({ json: accounts });
  });
  await page.goto('/users');
  await expect(page.getByRole('alert')).toHaveText(
    'Only administrators can manage users.'
  );
  await expect(
    page.getByRole('link', { name: 'Users', exact: true })
  ).toHaveCount(0);
  expect(requests).toBe(0);
});

test('creates an account, reports duplicate errors and clears secrets on reopening', async ({
  page,
}) => {
  await session(page);
  let created = false;
  let creates = 0;
  await page.route('**/api/auth/users', async (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({
        json: created
          ? [
              ...accounts,
              { id: 3, login: 'new_viewer', is_admin: false, is_active: true },
            ]
          : accounts,
      });
    creates++;
    expect(route.request().postDataJSON()).toEqual({
      login: 'new_viewer',
      password: 'secure-password1',
      role: 'viewer',
    });
    if (creates === 1)
      return route.fulfill({
        status: 409,
        json: { detail: 'User already exists' },
      });
    created = true;
    return route.fulfill({
      status: 201,
      json: {
        login: 'new_viewer',
        role: 'viewer',
        authentication_enabled: true,
      },
    });
  });
  await page.goto('/users');
  await expect(
    page.getByRole('button', { name: 'Disable admin', exact: true })
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Login', { exact: true }).fill('new_viewer');
  await dialog
    .getByLabel('New password', { exact: true })
    .fill('secure-password1');
  await dialog.getByLabel('Confirm new password').fill('different-password');
  await dialog.getByRole('button', { name: 'Create user' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Passwords do not match.');
  expect(creates).toBe(0);
  await dialog.getByLabel('Confirm new password').fill('secure-password1');
  await dialog.getByRole('button', { name: 'Create user' }).click();
  await expect(dialog.getByRole('alert')).toHaveText('User already exists');
  await dialog.getByRole('button', { name: 'Create user' }).click();
  await expect(
    page.getByRole('rowheader', { name: 'new_viewer' })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  await expect(dialog.getByLabel('New password', { exact: true })).toHaveValue(
    ''
  );
});

test('confirms status changes, preserves server rejection, and resets passwords with 204 responses', async ({
  page,
}) => {
  await session(page);
  let active = true;
  let statusCalls = 0;
  await page.route('**/api/auth/users', (route) =>
    route.fulfill({
      json: [
        accounts[0],
        { ...accounts[1], is_admin: true, is_active: active },
      ],
    })
  );
  await page.route('**/api/auth/users/2/status', async (route) => {
    statusCalls++;
    expect(route.request().postDataJSON()).toEqual({ is_active: !active });
    // Another administrator can become inactive after the list was fetched.
    if (statusCalls === 1)
      return route.fulfill({
        status: 409,
        json: { detail: 'Cannot deactivate the last active administrator' },
      });
    active = !active;
    return route.fulfill({
      json: { ...accounts[1], is_admin: true, is_active: active },
    });
  });
  await page.route('**/api/auth/users/2/reset-password', (route) => {
    expect(route.request().postDataJSON()).toEqual({
      new_password: 'replacement-password',
    });
    return route.fulfill({ status: 204 });
  });
  await page.goto('/users');
  await page
    .getByRole('button', { name: 'Disable researcher', exact: true })
    .click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(statusCalls).toBe(0);
  await page
    .getByRole('button', { name: 'Disable researcher', exact: true })
    .click();
  await page.getByRole('button', { name: 'Disable user', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Cannot deactivate the last active administrator'
  );
  await page.getByRole('button', { name: 'Disable user', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Enable researcher', exact: true })
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Enable researcher', exact: true })
    .click();
  await page.getByRole('button', { name: 'Enable user', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Disable researcher', exact: true })
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Reset password for researcher', exact: true })
    .click();
  await page
    .getByLabel('New password', { exact: true })
    .fill('replacement-password');
  await page.getByLabel('Confirm new password').fill('replacement-password');
  await page
    .getByRole('button', { name: 'Reset password', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText(
    'Password reset for researcher.'
  );
});

test('recovers from list failure and gates an expired session instead of showing cached users', async ({
  page,
}) => {
  let expired = false;
  let loads = 0;
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: expired ? 401 : 200,
      json: expired
        ? { detail: 'Authentication required' }
        : { login: 'admin', role: 'admin', authentication_enabled: true },
    })
  );
  await page.route('**/api/auth/users', (route) => {
    loads++;
    return route.fulfill({
      status: expired ? 401 : loads === 1 ? 500 : 200,
      json: expired
        ? { detail: 'Authentication required' }
        : loads === 1
          ? { detail: 'Database unavailable' }
          : accounts,
    });
  });
  await page.goto('/users');
  await expect(page.getByRole('alert')).toContainText('Database unavailable');
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(
    page.getByRole('rowheader', { name: 'researcher' })
  ).toBeVisible();
  expired = true;
  await page.getByRole('button', { name: 'Refresh', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Sign in', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('table')).toHaveCount(0);
});

test('changes own password with error recovery and clears fields only after success', async ({
  page,
}) => {
  await session(page, 'operator');
  let calls = 0;
  await page.route('**/api/auth/change-password', (route) => {
    calls++;
    expect(route.request().postDataJSON()).toEqual({
      current_password: 'old-password',
      new_password: 'new-secure-password',
    });
    return route.fulfill(
      calls === 1
        ? { status: 400, json: { detail: 'Incorrect current password' } }
        : { status: 204 }
    );
  });
  await page.goto('/settings');
  await page
    .getByLabel('Current password', { exact: true })
    .fill('old-password');
  await page
    .getByLabel('New password', { exact: true })
    .fill('new-secure-password');
  await page.getByLabel('Confirm new password').fill('new-secure-password');
  await page
    .getByRole('button', { name: 'Change password', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Incorrect current password'
  );
  await expect(
    page.getByLabel('Current password', { exact: true })
  ).toHaveValue('old-password');
  await page
    .getByRole('button', { name: 'Change password', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText('Password changed.');
  await expect(
    page.getByLabel('Current password', { exact: true })
  ).toHaveValue('');
  await expect(page.getByLabel('New password', { exact: true })).toHaveValue(
    ''
  );
});

test('changes passwords at the Unicode upper boundary without altering either secret', async ({
  page,
}) => {
  await session(page, 'operator');
  const current = `${'a'.repeat(255)}🔐`;
  const password = ` e\u0301${'a'.repeat(251)}🔐 `;
  const payloads: unknown[] = [];
  await page.route('**/api/auth/change-password', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });
  await page.goto('/settings');
  await page
    .getByLabel('Current password', { exact: true })
    .fill(`${current}a`);
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password').fill(password);
  await page
    .getByRole('button', { name: 'Change password', exact: true })
    .click();
  await expect(page.getByRole('alert')).toHaveText(
    'Current password must contain 1–256 characters.'
  );
  expect(payloads).toEqual([]);
  await page.getByLabel('Current password', { exact: true }).fill(current);
  for (const invalid of ['🔐'.repeat(6), `${'a'.repeat(256)}🔐`]) {
    await page.getByLabel('New password', { exact: true }).fill(invalid);
    await page.getByLabel('Confirm new password').fill(invalid);
    await page
      .getByRole('button', { name: 'Change password', exact: true })
      .click();
    await expect(page.getByRole('alert')).toHaveText(
      'New password must contain 12–256 characters.'
    );
    expect(payloads).toEqual([]);
  }
  await page.getByLabel('New password', { exact: true }).fill(password);
  await page.getByLabel('Confirm new password').fill(password);
  await page
    .getByRole('button', { name: 'Change password', exact: true })
    .click();
  await expect(page.getByRole('status')).toHaveText('Password changed.');
  expect(payloads).toEqual([
    { current_password: current, new_password: password },
  ]);
});

test('creates users with a backend-valid supplementary-character password intact', async ({
  page,
}) => {
  await session(page);
  const password = `${'a'.repeat(255)}🔐`;
  const payloads: unknown[] = [];
  await page.route('**/api/auth/users', (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: accounts });
    payloads.push(route.request().postDataJSON());
    return route.fulfill({
      status: 201,
      json: {
        login: 'unicode_user',
        role: 'viewer',
        authentication_enabled: true,
      },
    });
  });
  await page.goto('/users');
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Login', { exact: true }).fill('unicode_user');
  await dialog.getByLabel('New password', { exact: true }).fill(password);
  await dialog.getByLabel('Confirm new password').fill(password);
  await expect(dialog.getByLabel('New password', { exact: true })).toHaveValue(
    password
  );
  await expect(dialog.getByLabel('Confirm new password')).toHaveValue(password);
  await dialog.getByRole('button', { name: 'Create user' }).click();
  await expect(page.getByRole('status')).toHaveText('User created.');
  expect(payloads).toEqual([
    { login: 'unicode_user', password, role: 'viewer' },
  ]);
});

test('validates reset passwords by code points, preserving whitespace and combining characters', async ({
  page,
}) => {
  await session(page);
  const payloads: unknown[] = [];
  await page.route('**/api/auth/users', (route) =>
    route.fulfill({ json: accounts })
  );
  await page.route('**/api/auth/users/2/reset-password', (route) => {
    payloads.push(route.request().postDataJSON());
    return route.fulfill({ status: 204 });
  });
  await page.goto('/users');
  await page
    .getByRole('button', { name: 'Reset password for researcher', exact: true })
    .click();
  const dialog = page.getByRole('dialog');
  for (const invalid of ['🔐'.repeat(6), `${'a'.repeat(256)}🔐`]) {
    await dialog.getByLabel('New password', { exact: true }).fill(invalid);
    await dialog.getByLabel('Confirm new password').fill(invalid);
    await dialog.getByRole('button', { name: 'Reset password' }).click();
    await expect(dialog.getByRole('alert')).toHaveText(
      'New password must contain 12–256 characters.'
    );
    expect(payloads).toEqual([]);
  }
  // Twelve code points, not twelve graphemes; whitespace remains significant.
  const password = ' e\u0301'.repeat(4);
  await dialog.getByLabel('New password', { exact: true }).fill(password);
  await dialog.getByLabel('Confirm new password').fill(password);
  await dialog.getByRole('button', { name: 'Reset password' }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Password reset for researcher.'
  );
  expect(payloads).toEqual([{ new_password: password }]);
});

test('does not offer an own-password mutation in development access', async ({
  page,
}) => {
  await session(page, 'admin', false);
  await page.goto('/settings');
  await expect(
    page.getByText(
      'Password changes are unavailable while authentication is disabled.'
    )
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Change password', exact: true })
  ).toHaveCount(0);
});

test('discards password drafts and open dialogs when another tab changes the account', async ({
  page,
}) => {
  let login = 'admin';
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      json: { login, role: 'admin', authentication_enabled: true },
    })
  );
  await page.route('**/api/auth/users', (route) =>
    route.fulfill({ json: accounts })
  );
  await page.goto('/settings');
  await page
    .getByLabel('Current password', { exact: true })
    .fill('previous-user-password');
  await page
    .getByLabel('New password', { exact: true })
    .fill('private-password-draft');
  login = 'second_admin';
  // React Query rechecks the cookie-backed identity when the tab becomes visible.
  await page.evaluate(() =>
    window.dispatchEvent(new Event('visibilitychange'))
  );
  await expect(
    page.getByText('Change the password for second_admin.', { exact: false })
  ).toBeVisible();
  await expect(
    page.getByLabel('Current password', { exact: true })
  ).toHaveValue('');
  await expect(page.getByLabel('New password', { exact: true })).toHaveValue(
    ''
  );
  await page.getByRole('link', { name: 'Users', exact: true }).click();
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByLabel('New password', { exact: true })
    .fill('another-private-draft');
  login = 'third_admin';
  await page.evaluate(() =>
    window.dispatchEvent(new Event('visibilitychange'))
  );
  await expect(page.getByText('third_admin', { exact: true })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create user', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByLabel('New password', { exact: true })
  ).toHaveValue('');
});
