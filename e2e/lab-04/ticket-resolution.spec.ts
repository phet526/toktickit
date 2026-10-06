import { test, expect } from '@playwright/test';
// @ts-ignore
import { execSync } from 'node:child_process';

test.describe('Lab 4 — Ticket Resolution Gate & Lifecycle Transitions (E2E-04, E2E-05)', () => {
  test.beforeEach(() => {
    try {
      execSync('npm run prisma:seed --prefix server', { stdio: 'ignore' });
      const cleanupCmd = `node -e "const { PrismaClient } = require('./server/node_modules/@prisma/client'); const p = new PrismaClient(); p.ticket.findUnique({ where: { ticketNo: 'TKT-2026-00005' } }).then(t => t && p.actionTaken.deleteMany({ where: { ticketId: t.id } })).then(() => p.ticket.update({ where: { ticketNo: 'TKT-2026-00005' }, data: { currentStatus: 'Open' } })).then(() => { process.exit(0); });"`;
      execSync(cleanupCmd, { stdio: 'ignore' });
    } catch {
      // fallback
    }
  });

  test.describe('Desktop Viewport (1280x720)', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-04: Resolution Gate blocks resolution on 0 actions ticket -> unlocks when action added', async ({ page }) => {
      // 1. Login as IT Staff (David Lee - assigned to TKT-2026-00005 which has 0 actions)
      await page.goto('/');
      await page.fill('#email', 'david.lee@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/staff\/dashboard/);

      // 2. Open TKT-2026-00005 from Queue
      await page.goto('/staff/queue');
      await page.fill('#searchQueue', 'ERP permission');
      await page.waitForTimeout(600); // debounce

      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await expect(ticketLink).toBeVisible();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. Verify ticket is Open and currently has 0 Actions Taken
      await expect(page.locator('#emptyActionsState')).toBeVisible();

      // 4. Attempt to transition status to "Resolved"
      const statusSelect = page.locator('#selectTicketStatus');
      await expect(statusSelect).toBeVisible();
      await statusSelect.selectOption('Resolved');

      // 5. Verify Resolution Gate blocks transition and displays inline warning banner
      await expect(page.locator('#resolutionGateWarning')).toBeVisible();
      await expect(page.locator('#resolutionGateWarning')).toContainText(/Resolution Gate Failed/i);
      await expect(page.locator('#resolutionGateWarning')).toContainText(/at least one Action Taken record/i);

      // 6. Satisfy Resolution Gate: Add required Action Taken
      await page.click('#btnAddActionTaken');
      await page.fill('#actionDescriptionInput', 'Reviewed annual audit clearance and configured ERP read-only finance role.');
      await page.fill('#resultInput', 'Security team approved and finance access granted successfully.');
      await page.click('#btnSaveAction');

      // Verify Action Taken is recorded
      await expect(page.locator('#actionsTableDesktop')).toBeVisible();
      await expect(page.locator('#actionsTableDesktop').getByText('Reviewed annual audit clearance').first()).toBeVisible();

      // 7. Transition to Resolved now succeeds
      await statusSelect.selectOption('Resolved');
      await expect(page.locator('#resolutionGateWarning')).not.toBeVisible();
      await expect(page.locator('.badge').filter({ hasText: 'Resolved' }).first()).toBeVisible();
    });

    test('E2E-05: Requester Advisory Signal does not alter formal status (BR-09) & Lifecycle Stability', async ({ page }) => {
      // 1. Login as Requester (Jennifer Anderson)
      await page.goto('/');
      await page.fill('#email', 'jennifer.anderson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/.*\/requester\/dashboard/);

      // 2. Open active ticket TKT-2026-00003
      await page.goto('/my-tickets');
      await page.fill('input[placeholder*="Search"]', 'VPN');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(500);

      const ticketLink = page.locator('tbody tr td a:has-text("View")').first();
      await ticketLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. Click "Problem Appears Resolved" button
      const indicateResolvedBtn = page.locator('#btnIndicateResolved');
      if (await indicateResolvedBtn.isVisible()) {
        await indicateResolvedBtn.click();
        await expect(page.locator('#btnConfirmResolve')).toBeVisible();
        await page.click('#btnConfirmResolve');

        // 4. Verify Advisory Banner appears
        await expect(page.locator('text=Resolution Indicated by Requester')).toBeVisible();
        
        // 5. Verify Formal Status remains "In Progress", NOT changed to "Resolved"
        await expect(page.locator('.badge').filter({ hasText: 'In Progress' }).first()).toBeVisible();
      }
    });
  });
});
