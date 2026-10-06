import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'node:child_process';

test.describe('Lab 4 — Actions Taken Workflow & Access Control (E2E-01, E2E-02, E2E-03)', () => {
  test.beforeAll(() => {
    try {
      execSync('npm run prisma:seed --prefix server', { stdio: 'ignore' });
    } catch {
      // fallback
    }
  });

  test.describe('Desktop Viewport (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-01: IT Staff creates Action Taken with mandatory Follow-up Note validation', async ({ page }) => {
      // 1. Login as IT Staff (Michael Brown)
      await page.goto('/');
      await page.fill('#email', 'michael.brown@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      // 2. Navigate to Ticket Queue and open first ticket
      await page.goto('/staff/queue');
      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await expect(ticketLink).toBeVisible();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. Open Add Action Taken Modal
      const addActionBtn = page.locator('#btnAddActionTaken');
      await expect(addActionBtn).toBeVisible();
      await addActionBtn.click();

      // 4. Verify Modal & Auto-bound Performer (Read-only)
      await expect(page.locator('#actionTakenModalTitle')).toContainText('Add Action Taken');
      const performerInput = page.locator('input[aria-label="Performed By"]');
      await expect(performerInput).toHaveValue(/Michael Brown/);
      await expect(performerInput).toBeDisabled();

      // 5. Test Conditional Validation: Toggle Follow-up without note
      await page.fill('#actionDescriptionInput', 'Replaced faulty ethernet patch cable and reset switch port.');
      await page.fill('#resultInput', 'Port link status returned to 1 Gbps Full Duplex.');
      await page.click('#followUpRequiredCheck'); // Check follow-up
      await expect(page.locator('#followUpNoteInput')).toBeVisible();

      // Submit without follow-up note -> Expect validation error
      await page.click('#btnSaveAction');
      await expect(page.locator('#followUpNoteError')).toBeVisible();
      await expect(page.locator('#followUpNoteError')).toContainText(/Follow-up note is required/i);

      // 6. Complete valid Action Taken submission
      await page.fill('#followUpNoteInput', 'Monitor port CRC error counters after 24 hours.');
      await page.fill('#attachmentNotesInput', 'switch-port-status.png');
      await page.click('#btnSaveAction');

      // 7. Verify Action Taken appears in desktop table with badges
      await expect(page.locator('#actionsTableDesktop')).toBeVisible();
      await expect(page.locator('#actionsTableDesktop').getByText('Replaced faulty ethernet patch cable').first()).toBeVisible();
      await expect(page.locator('#actionsTableDesktop').getByText('Follow-Up Req').first()).toBeVisible();
      await expect(page.locator('#actionsTableDesktop').getByText('switch-port-status.png').first()).toBeVisible();
    });

    test('E2E-02: Collaborative Action Recording by second IT Staff member (BR-02)', async ({ page }) => {
      // 1. Fresh login as second IT Staff (David Lee)
      await page.goto('/');
      await page.fill('#email', 'david.lee@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      // 2. Open the same ticket from Queue
      await page.goto('/staff/queue');
      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. Add second Action Taken by David Lee
      await page.click('#btnAddActionTaken');
      const performerInput = page.locator('input[aria-label="Performed By"]');
      await expect(performerInput).toHaveValue(/David Lee/);

      await page.fill('#actionDescriptionInput', 'Verified DHCP pool lease assignment and ping latency.');
      await page.fill('#resultInput', 'Round-trip latency is stable under 2ms.');
      await page.click('#btnSaveAction');

      // 4. Verify table shows actions performed by both staff members
      await expect(page.locator('#actionsTableDesktop')).toBeVisible();
      await expect(page.locator('#actionsTableDesktop').getByText('Verified DHCP pool lease assignment').first()).toBeVisible();
      await expect(page.locator('#actionsTableDesktop')).toContainText('David Lee');
      await expect(page.locator('#actionsTableDesktop')).toContainText('Michael Brown');
    });

    test('E2E-03: Requester views Actions Taken in Read-Only Mode (AC-05, BR-03)', async ({ page }) => {
      // 1. Fresh login as Requester (Jennifer Anderson)
      await page.goto('/');
      await page.fill('#email', 'jennifer.anderson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/requester\/dashboard/);

      // 2. Navigate to My Tickets and search for ticket with seeded actions (VPN)
      await page.goto('/my-tickets');
      await page.fill('input[placeholder*="Search"]', 'VPN');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(500);

      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. Strict Read-Only Verification
      await expect(page.locator('h5:has-text("Actions Taken")')).toBeVisible();
      // Add button MUST NOT be present
      await expect(page.locator('#btnAddActionTaken')).not.toBeVisible();
      // Edit buttons MUST NOT be present
      await expect(page.locator('button[id^="btnEditAction-"]')).not.toBeVisible();
      // Action table is readable
      await expect(page.locator('#actionsTableDesktop')).toBeVisible();
    });
  });

  test.describe('Mobile Viewport (375x667)', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('Should display stacked card view without horizontal scrollbar on mobile (< 768px)', async ({ page }) => {
      await page.goto('/');
      await page.fill('#email', 'michael.brown@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      await page.goto('/staff/queue');
      await expect(page).toHaveURL(/.*\/staff\/queue/);
      
      // On mobile viewport, click the mobile card's View Detail link
      const mobileTicketLink = page.getByRole('link', { name: 'View Detail' }).first();
      await expect(mobileTicketLink).toBeVisible();
      await mobileTicketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // Verify Stacked Cards View is rendered on mobile
      await expect(page.locator('#actionsListMobile')).toBeVisible();
      await expect(page.locator('#actionsTableDesktop')).not.toBeVisible();

      // Verify Zero Horizontal Overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
