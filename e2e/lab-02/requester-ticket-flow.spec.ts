import { test, expect } from '@playwright/test';

test.describe('Requester Ticket Flow (E2E-01)', () => {
  // Test across different screen sizes as per NFR-01
  test.use({ viewport: { width: 1280, height: 720 } }); // Desktop

  test('Should complete the full flow from login to viewing a created ticket', async ({ page }) => {
    // 1. Mock Login (RequesterSelector)
    await page.goto('http://localhost:5173/');
    
    // Check if on login page (Lab 3 Authentication) or legacy Simulated Login
    if (await page.locator('#email').isVisible()) {
      await page.fill('#email', 'requester_a@example.com');
      await page.fill('#password', 'Toktick2026!');
      await page.click('button[type="submit"]');
    } else {
      await expect(page.locator('h4')).toContainText('TokTickIT');
      await page.waitForSelector('select#requesterId option[value="1"]', { state: 'attached' });
      await page.locator('select#requesterId').selectOption({ index: 1 });
      await page.locator('button', { hasText: 'Continue' }).click();
    }

    // 2. My Tickets (List Page)
    // Should be redirected to /my-tickets
    await expect(page).toHaveURL(/.*\/my-tickets/);
    await expect(page.locator('h4')).toContainText('My Tickets');

    // 3. Create Ticket
    await page.locator('a', { hasText: '+ Create Ticket' }).click();
    await expect(page).toHaveURL(/.*\/create-ticket/);

    // Wait for reference data to load
    await page.waitForSelector('select#categoryId option[value="1"]', { state: 'attached' });
    
    // Fill the form
    await page.locator('select#categoryId').selectOption({ index: 1 });
    await page.locator('select#relatedSystemId').selectOption({ index: 1 });
    await page.locator('select#requestedPriority').selectOption('HIGH');
    await page.fill('input#summary', 'E2E Test Ticket Summary');
    await page.fill('textarea#description', 'This ticket is created by an automated Playwright E2E test.');
    
    // Submit
    await page.locator('button', { hasText: 'Submit Ticket' }).click();

    // Expect success message
    await expect(page.locator('.alert-success')).toBeVisible();
    await expect(page.locator('.alert-heading')).toContainText('Ticket Created Successfully!');

    // 4. Go back to My Tickets and view detail
    await page.goto('http://localhost:5173/my-tickets');
    
    // Search for the ticket
    await page.fill('input[placeholder="Search by Ticket No or Summary..."]', 'E2E Test Ticket Summary');
    await page.locator('button', { hasText: 'Search' }).click();

    // Click View on the first result
    await page.locator('a', { hasText: 'View' }).first().click();

    // 5. Ticket Detail
    await expect(page).toHaveURL(/.*\/tickets\/\d+/);
    await expect(page.getByText('E2E Test Ticket Summary').first()).toBeVisible();
  });

  test.describe('Mobile Viewport (Responsive Check)', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // Mobile

    test('Should not have horizontal scrollbar on mobile', async ({ page }) => {
      await page.goto('http://localhost:5173/');
      
      if (await page.locator('#email').isVisible()) {
        await page.fill('#email', 'requester_a@example.com');
        await page.fill('#password', 'Toktick2026!');
        await page.click('button[type="submit"]');
      } else {
        await page.waitForSelector('select#requesterId option[value="1"]', { state: 'attached' });
        await page.locator('select#requesterId').selectOption({ index: 1 });
        await page.locator('button', { hasText: 'Continue' }).click();
      }

      // Check horizontal scroll
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      
      expect(hasHorizontalScroll).toBe(false);
    });
  });
});
