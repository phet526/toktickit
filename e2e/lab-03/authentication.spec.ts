import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';

test.describe('Lab 3 — Authentication & Session Management (E2E-01, E2E-02)', () => {
  test.beforeAll(() => {
    try {
      execSync('npm run prisma:seed --prefix server', { stdio: 'ignore' });
    } catch {
      // fallback
    }
  });

  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-01: Valid Login, Role-Based Navigation, and Secure Logout', async ({ page }) => {
      // 1. IT Staff Login
      await page.goto('/');
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();

      await page.fill('#email', 'sarah.johnson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // Should land on staff queue
      await expect(page).toHaveURL(/.*\/staff\/queue/);
      await expect(page.locator('nav.navbar')).toContainText('Sarah Johnson');
      await expect(page.locator('nav.navbar')).toContainText('IT Staff');
      await expect(page.locator('a[href*="/staff/queue"]')).toBeVisible();

      // IT Staff should NOT see User Management
      await expect(page.locator('a[href*="/admin/users"]')).not.toBeVisible();

      // 2. Logout
      const signOutBtn = page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")');
      await expect(signOutBtn).toBeVisible();
      await signOutBtn.click();

      // Redirected back to login
      await expect(page).toHaveURL(/\/(login)?$/);
      await expect(page.locator('#email')).toBeVisible();

      // Protected route should now be blocked
      await page.goto('/staff/queue');
      await expect(page).toHaveURL(/\/(login)?$/);
      await expect(page.locator('#email')).toBeVisible();

      // 3. Administrator Login
      await page.fill('#email', 'john.smith@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // Admin lands on User Management by default, can switch to Queue and back
      await expect(page).toHaveURL(/.*\/admin\/users/);
      await expect(page.locator('nav.navbar')).toContainText('John Smith');
      await expect(page.locator('nav.navbar')).toContainText('Administrator');
      await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();
      await expect(page.locator('a[href*="/staff/queue"]')).toBeVisible();

      // Switch to Queue
      await page.locator('a[href*="/staff/queue"]').click();
      await expect(page).toHaveURL(/.*\/staff\/queue/);

      // Switch back to User Management
      await page.locator('a[href*="/admin/users"]').click();
      await expect(page).toHaveURL(/.*\/admin\/users/);

      // Logout Admin
      await page.locator('button:has-text("Sign Out"), a:has-text("Sign Out")').click();
      await expect(page.locator('#email')).toBeVisible();

      // 4. Inactive / Deactivated Account Login Attempt
      await page.fill('#email', 'requester_c@example.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // Expect safe error notification
      await expect(page.locator('.alert-danger, [role="alert"]')).toBeVisible();
      await expect(page.locator('.alert-danger, [role="alert"]')).toContainText('Account is deactivated');
    });

    test('E2E-02: Mandatory First-Login Password Change & Policy Enforcement', async ({ page }) => {
      // Ensure requester_e is in pristine state requiring password change
      try {
        execSync('npm run prisma:seed --prefix server', { stdio: 'ignore' });
      } catch {}

      // Use Requester E who requires password change at first login
      await page.goto('/');
      await page.fill('#email', 'requester_e@example.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // Verify immediate forced redirection to /change-password
      await expect(page).toHaveURL(/.*\/change-password/);
      await expect(page.getByRole('heading', { name: 'Change Your Password' })).toBeVisible();

      // Attempting to bypass by direct URL navigation should remain locked
      await page.goto('/my-tickets');
      await expect(page).toHaveURL(/.*\/change-password/);

      // Verify Dynamic Password Policy Checklist
      await page.fill('#currentPassword', 'Toktick2026!');

      // Type weak password: "weak"
      await page.fill('#newPassword', 'weak');
      // Checklist items should show unmet indicators
      await expect(page.locator('text=Be at least 8 characters')).toBeVisible();

      // Type valid strong password
      const validNewPassword = 'Toktick2026!StrongPass';
      await page.fill('#newPassword', validNewPassword);

      // Confirm with mismatch
      await page.fill('#confirmPassword', 'Mismatch123!');
      await expect(page.locator('text=Passwords do not match')).toBeVisible();

      // Confirm with exact match
      await page.fill('#confirmPassword', validNewPassword);
      await expect(page.locator('text=Passwords do not match')).not.toBeVisible();

      // Submit password change
      const submitBtn = page.locator('button[type="submit"]:has-text("Continue")');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // Should unlock access and land on Requester dashboard /my-tickets
      await expect(page).toHaveURL(/.*\/my-tickets/);
      await expect(page.locator('nav.navbar')).toContainText('Requester E');
    });
  });

  test.describe('Mobile Viewport (Responsive Check)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE / Mobile

    test('Should have zero horizontal scrollbar on Login screen (< 768px)', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#email')).toBeVisible();

      // Verify no horizontal overflow on login screen
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
