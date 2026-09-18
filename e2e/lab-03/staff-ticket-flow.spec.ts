import { test, expect } from '@playwright/test';

test.describe('Lab 3 — Staff Ticket Lifecycle & Requester Isolation (E2E-03, E2E-05)', () => {
  test.describe('Desktop Viewport', () => {
    test.use({ viewport: { width: 1280, height: 720 } });

    test('E2E-03: IT Staff Queue Search, Claim, Priority, Status, Comments, and Internal Notes', async ({ page }) => {
      // 1. Login as IT Staff
      await page.goto('/');
      await page.fill('#email', 'sarah.johnson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // 2. Queue Search & Filter
      await expect(page).toHaveURL(/.*\/staff\/queue/);
      await expect(page.locator('h2, h3, h4')).toContainText('IT Staff Ticket Queue');

      // Search with debounce
      const searchInput = page.locator('#searchQueue, input[placeholder*="Summary"]');
      await expect(searchInput).toBeVisible();
      await searchInput.fill('VPN');
      await page.waitForTimeout(600); // debounce wait

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(600);

      // Filter by Status: In Progress or Open
      const statusFilter = page.locator('select#statusFilter, select[aria-label*="Status"]');
      if (await statusFilter.isVisible()) {
        await statusFilter.selectOption({ index: 0 }); // reset to All
      }

      // 3. Open First Ticket in Queue
      const firstTicketLink = page.locator('tbody tr td a:has-text("View")').first();
      await expect(firstTicketLink).toBeVisible();
      await firstTicketLink.click();

      // Should be on Ticket Detail page
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);
      await expect(page.locator('h4, .badge.font-monospace').first()).toBeVisible();

      // 4. Ticket Claim (if unassigned)
      const claimBtn = page.locator('#btnClaimTicket');
      if (await claimBtn.isVisible()) {
        await claimBtn.click();
        await expect(page.locator('.toast, .alert, [role="alert"]').filter({ hasText: /claim/i })).toBeVisible();
      }

      // 5. Update IT Priority
      const prioritySelect = page.locator('#selectITPriority');
      if (await prioritySelect.isVisible()) {
        await prioritySelect.selectOption('Critical');
        await expect(page.locator('.toast-body, .alert, [role="alert"]').filter({ hasText: /Critical/i })).toBeVisible();
      }

      // 6. Update Ticket Status (if transitions available)
      const statusSelect = page.locator('#selectTicketStatus');
      if (await statusSelect.isVisible()) {
        const optionCount = await statusSelect.locator('option').count();
        if (optionCount > 1) {
          await statusSelect.selectOption({ index: 1 });
          await page.waitForTimeout(500);
        }
      }

      // 7. Post Public Comment
      const commentInput = page.locator('#publicCommentInput');
      await expect(commentInput).toBeVisible();
      const testComment = `Staff Public Update verified at ${Date.now()}`;
      await commentInput.fill(testComment);
      await page.click('#btnSubmitComment');

      // Verify comment appears in the timeline
      await expect(page.locator(`text=${testComment}`)).toBeVisible();

      // 8. Internal Notes (Confidential)
      const notesTab = page.locator('#tabInternalNotes');
      await expect(notesTab).toBeVisible();
      await notesTab.click();

      // Verify confidential banner
      await expect(page.locator('text=Strictly Confidential')).toBeVisible();

      // Post Internal Note
      const noteInput = page.locator('#internalNoteInput');
      await expect(noteInput).toBeVisible();
      const testNote = `Internal technical diagnostic recorded at ${Date.now()}`;
      await noteInput.fill(testNote);
      await page.click('#btnSubmitNote');

      // Verify note appears in notes timeline
      await expect(page.locator(`text=${testNote}`)).toBeVisible();
    });

    test('E2E-05: Requester Data Isolation & Resolution Indication', async ({ page }) => {
      // 1. Login as Requester A
      await page.goto('/');
      await page.fill('#email', 'requester_a@example.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      // 2. Open My Tickets
      await expect(page).toHaveURL(/.*\/my-tickets/);
      const ticketRow = page.locator('tbody tr').first();
      await expect(ticketRow).toBeVisible();

      // Click View
      const viewLink = ticketRow.locator('a:has-text("View")').first();
      await viewLink.click();
      await expect(page).toHaveURL(/.*\/tickets\/\d+/);

      // 3. STRICT DATA ISOLATION VERIFICATION (Zero Leakage)
      // Internal Notes tab MUST NEVER exist for Requester
      await expect(page.locator('#tabInternalNotes')).not.toBeVisible();
      // Staff operational controls MUST NOT be present
      await expect(page.locator('#btnClaimTicket')).not.toBeVisible();
      await expect(page.locator('#selectITPriority')).not.toBeVisible();
      await expect(page.locator('#selectTicketStatus')).not.toBeVisible();

      // 4. Indicate Problem Resolved (if available on current ticket status)
      const resolveBtn = page.locator('#btnIndicateResolved');
      if (await resolveBtn.isVisible()) {
        await resolveBtn.click();

        // Confirmation Modal pops up
        await expect(page.locator('.modal.show')).toBeVisible();
        await expect(page.locator('#btnConfirmResolve')).toBeVisible();
        await page.click('#btnConfirmResolve');

        // Verify Resolution Indicated banner and Public Comment
        await expect(page.locator('text=Resolution Indicated').first()).toBeVisible();
      }
    });
  });

  test.describe('Mobile Viewport (Responsive Check)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile

    test('Should adapt without horizontal scrollbar on Staff Queue and Detail screens (< 768px)', async ({ page }) => {
      // Login as Staff
      await page.goto('/');
      await page.fill('#email', 'sarah.johnson@toktickit.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');

      await expect(page).toHaveURL(/.*\/staff\/queue/);

      // Verify no horizontal overflow on Staff Queue mobile card view
      let hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasHorizontalScroll).toBe(false);

      // Open detail
      const cardLink = page.locator('.card a:has-text("View"), a:has-text("View")').first();
      if (await cardLink.isVisible()) {
        await cardLink.click();
        await page.waitForLoadState('networkidle');

        hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });
        expect(hasHorizontalScroll).toBe(false);
      }
    });
  });
});
