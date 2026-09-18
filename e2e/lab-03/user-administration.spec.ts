import { test, expect } from '@playwright/test';

test.describe('Lab 3 — Administrator User Management & Superuser Operations (E2E-04)', () => {
  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-04: User List, Search, Create, Safety Rules, Activate/Deactivate, and Superuser Access', async ({ page }) => {
      // 1. Login as Administrator
      await page.goto('/');
      await page.fill('#email', 'john.smith@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // 2. Lands on User Management by default
      await expect(page).toHaveURL(/.*\/admin\/users/);
      await expect(page.getByRole('heading', { name: /User Management/i })).toBeVisible();

      // 3. Search & Role Filter
      const searchInput = page.locator('input[placeholder*="Search by name or email"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('Sarah');
      await page.click('button:has-text("Search")');
      await expect(page.locator('tbody tr')).toContainText('Sarah Johnson');

      // Clear Search
      const clearBtn = page.locator('button[title="Clear search"], button:has-text("✕")');
      if (await clearBtn.isVisible()) {
        await clearBtn.click();
      } else {
        await searchInput.fill('');
        await page.click('button:has-text("Search")');
      }

      // 4. Create New User
      await page.click('[data-testid="create-user-btn"]');
      await expect(page.locator('.modal.show')).toBeVisible();

      const uniqueSuffix = Date.now();
      const newEmail = `alex.e2e.${uniqueSuffix}@toktickit.com`;

      await page.fill('[data-testid="create-name-input"]', `Alex E2E ${uniqueSuffix}`);
      await page.fill('[data-testid="create-email-input"]', newEmail);
      await page.selectOption('[data-testid="create-role-select"]', 'IT_STAFF');
      await page.click('[data-testid="create-user-submit"], button[type="submit"]:has-text("Create User")');

      // Verify Success alert
      await expect(page.locator('.alert-success, [role="alert"]').filter({ hasText: /successfully/i })).toBeVisible();

      // 5. Test Duplicate Email Prevention
      await page.click('[data-testid="create-user-btn"]');
      await expect(page.locator('.modal.show')).toBeVisible();

      await page.fill('[data-testid="create-name-input"]', 'Duplicate Test');
      await page.fill('[data-testid="create-email-input"]', 'sarah.johnson@toktickit.com');
      await page.click('[data-testid="create-user-submit"], button[type="submit"]:has-text("Create User")');

      // Verify error message
      await expect(page.locator('.alert-danger')).toContainText('Email already in use');
      await page.locator('.modal.show button:has-text("Cancel")').click();

      // 6. Test Self-Protection (BR-19)
      const ownRow = page.locator('tbody tr', { hasText: 'John Smith' }).first();
      await expect(ownRow).toBeVisible();
      const selfDeactivateBtn = ownRow.locator('button:has-text("Deactivate")');
      await expect(selfDeactivateBtn).toBeDisabled();

      // 7. Test Activate/Deactivate Toggle
      // Find an inactive staff (Kevin Patel) or created user
      const toggleRow = page.locator('tbody tr', { hasText: 'Kevin Patel' }).first();
      if (await toggleRow.isVisible()) {
        const toggleBtn = toggleRow.locator('button:has-text("Activate"), button:has-text("Deactivate")').first();
        await toggleBtn.click();

        // Confirmation modal
        await expect(page.locator('.modal.show')).toBeVisible();
        await page.click('[data-testid="confirm-toggle-btn"]');
        await expect(page.locator('.modal.show')).not.toBeVisible();
      }

      // 8. Test Reset Password
      const resetRow = page.locator('tbody tr', { hasText: 'Alex E2E' }).first();
      await expect(resetRow).toBeVisible();
      await resetRow.locator('button:has-text("Reset Password")').click();

      // Reset modal opens
      await expect(page.locator('.modal.show')).toBeVisible();
      await page.fill('[data-testid="reset-password-input"]', 'Toktick2026!Reset');
      await page.click('[data-testid="reset-password-submit"]');

      // Success screen with temporary password copy display
      await expect(page.locator('[data-testid="temp-password-display"], .alert-success')).toBeVisible();
      await page.locator('.modal.show button:has-text("Done")').click();

      // 9. Administrator Superuser Ticket Operations
      await page.goto('/staff/queue');
      await expect(page).toHaveURL(/.*\/staff\/queue/);
      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // Verify Administrator has active controls (Superuser permissions)
      await expect(page.locator('#selectITPriority')).toBeVisible();
      await expect(page.locator('#publicCommentInput')).toBeVisible();
      await expect(page.locator('#tabInternalNotes')).toBeVisible();
    });
  });

  test.describe('Mobile Viewport (Responsive Check)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile

    test('Should render User Management in mobile cards without horizontal scrollbar (< 768px)', async ({ page }) => {
      await page.goto('/');
      await page.fill('#email', 'john.smith@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // John Smith lands on /admin/users automatically
      await expect(page).toHaveURL(/.*\/admin\/users/);

      // Check horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
