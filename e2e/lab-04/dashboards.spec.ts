import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'node:child_process';

test.describe('Lab 4 — Role Dashboards, Drill-down & Data Isolation (E2E-06, E2E-07, E2E-08)', () => {
  test.beforeEach(() => {
    try {
      execSync('npm run prisma:seed --prefix server', { stdio: 'ignore' });
    } catch {
      // fallback
    }
  });

  test.describe('Desktop Viewport (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-06: Requester Dashboard 4 Cards, Drill-down, and Strict Data Isolation (AC-13, AC-14)', async ({ page }) => {
      // 1. Login as Requester (Jennifer Anderson)
      await page.goto('/');
      await page.fill('#email', 'jennifer.anderson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // 2. Verify Requester Dashboard Header & 4 Metric Cards
      await expect(page).toHaveURL(/.*\/requester\/dashboard/);
      await expect(page.locator('h2, h3').filter({ hasText: /Welcome, Jennifer/i })).toBeVisible();

      await expect(page.locator('text=My Open Tickets')).toBeVisible();
      await expect(page.locator('text=In Progress').first()).toBeVisible();
      await expect(page.locator('text=Resolved').first()).toBeVisible();
      await expect(page.locator('text=Closed').first()).toBeVisible();

      // 3. Test Drill-down Link for Open Tickets
      const drillOpenLink = page.locator('#linkDrillOpen');
      await expect(drillOpenLink).toBeVisible();
      await drillOpenLink.click();
      await expect(page).toHaveURL(/.*\/my-tickets\?status=Open/);

      // 4. Verify Route Guard: Requester must be forbidden from accessing IT Staff Dashboard
      await page.goto('/staff/dashboard');
      // Should redirect back to requester dashboard
      await expect(page).toHaveURL(/.*\/requester\/dashboard/);
    });

    test('E2E-07a: IT Staff Dashboard 6 Cards, Priority Breakdown, and Quick Actions (AC-15)', async ({ page }) => {
      // 1. Login as IT Staff (Michael Brown)
      await page.goto('/');
      await page.fill('#email', 'michael.brown@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      // 2. Verify Staff Dashboard 6 Metric Cards
      await expect(page.locator('text=New').first()).toBeVisible();
      await expect(page.locator('text=Open').first()).toBeVisible();
      await expect(page.locator('text=In Progress').first()).toBeVisible();
      await expect(page.locator('text=Waiting Req').first()).toBeVisible();
      await expect(page.locator('text=My Assigned').first()).toBeVisible();
      await expect(page.locator('text=Unassigned').first()).toBeVisible();

      // 3. Verify Operational Panels
      await expect(page.locator('text=Tickets by IT Priority')).toBeVisible();
      await expect(page.locator('text=My Recent Tickets')).toBeVisible();

      // 4. Verify Quick Actions (Strict RBAC - No Create Ticket button for Staff)
      await expect(page.locator('a[href="/create-ticket"]')).toHaveCount(0);

      // 5. Test Drill-down Link for Unassigned Queue
      const unassignedLink = page.locator('a[href="/staff/queue?owner=unassigned"]').first();
      await expect(unassignedLink).toBeVisible();
      await unassignedLink.click();
      await expect(page).toHaveURL(/.*\/staff\/queue\?owner=unassigned/);
    });

    test('E2E-07b: Administrator Dashboard displays Admin Summary Panel (AC-15, FR-13)', async ({ page }) => {
      // 1. Login as Administrator
      await page.goto('/');
      await page.fill('#email', 'admin@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      // 2. Verify Admin Summary panel is displayed for Administrator
      await expect(page.locator('#panelAdminSummary')).toBeVisible();
      await expect(page.locator('text=Total Active Users')).toBeVisible();
      await expect(page.locator('a[href="/admin/users"]').first()).toBeVisible();
    });
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('E2E-08a: Responsive Requester Dashboard without horizontal scrollbar on mobile (< 768px)', async ({ page }) => {
      await page.goto('/');
      await page.fill('#email', 'jennifer.anderson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/requester\/dashboard/);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });

    test('E2E-08b: Responsive IT Staff Dashboard without horizontal scrollbar on mobile (< 768px)', async ({ page }) => {
      await page.goto('/');
      await page.fill('#email', 'michael.brown@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
