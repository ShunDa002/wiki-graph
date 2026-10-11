import { test, expect } from '@playwright/test';

test.describe('AI Chat Widget UI', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the root app
    await page.goto('/');
    // Wait for the graph canvas and launcher to be ready
    await expect(page.locator('#chat-launcher-btn')).toBeVisible({ timeout: 15000 });
  });

  test('Scenario 1: Launch and Initialization', async ({ page }) => {
    const launcher = page.locator('#chat-launcher-btn');
    await expect(launcher).toBeVisible();

    // Click launcher to open panel
    await launcher.click();

    // Chat panel should appear
    const panel = page.locator('#chat-panel');
    await expect(panel).toBeVisible();

    // Header title should be "LLM Wiki AI"
    await expect(panel.getByText('LLM Wiki AI')).toBeVisible();

    // Automated welcome message should appear
    const viewport = page.locator('#chat-message-viewport');
    await expect(viewport.getByText('Welcome to your AI Wiki Assistant!')).toBeVisible();

    // Suggested query chips should be visible
    await expect(panel.getByText('Suggested queries')).toBeVisible();

    // Composer input should be visible and focused
    const input = page.locator('#chat-composer-input');
    await expect(input).toBeVisible();
    await expect(input).toBeFocused();
  });

  test('Scenario 2: Sending a Local Mock Message', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    // Type a message and send with Enter
    await input.fill('hello');
    await input.press('Enter');

    // Input should be cleared
    await expect(input).toHaveValue('');

    // User message bubble should be visible
    const userBubble = page.locator('#chat-message-viewport').getByText('hello');
    await expect(userBubble).toBeVisible();

    // Response should arrive (from real backend or mock)
    const assistantResponse = page.locator('#chat-message-viewport').getByText(/Wiki information|Hello|prototype/i);
    await expect(assistantResponse.first()).toBeVisible({ timeout: 25000 });

    // The welcome assistant message displays the 'Simulated' badge
    const badge = page.locator('#message-simulated-badge');
    await expect(badge.first()).toBeVisible();
    await expect(badge.first()).toHaveText('Simulated');
  });

  test('Scenario 3: Draft and History Persistence', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    // Type an unsent draft
    await input.fill('this is an unsent draft');

    // Minimize chat
    await page.locator('#chat-minimize-btn').click();
    await expect(page.locator('#chat-launcher-btn')).toBeVisible();

    // Reopen chat
    await page.locator('#chat-launcher-btn').click();
    await expect(input).toHaveValue('this is an unsent draft');

    // Reload the page and verify draft is still restored
    await page.reload();
    await expect(page.locator('#chat-launcher-btn')).toBeVisible();
    await page.locator('#chat-launcher-btn').click();
    await expect(page.locator('#chat-composer-input')).toHaveValue('this is an unsent draft');
  });

  test('Scenario 4: Layout Expansion and Keyboard Accessibility', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const expandBtn = page.locator('#chat-expand-btn');

    // Expand widget
    await expandBtn.click();
    await expect(page.locator('#chat-panel')).toBeVisible();

    // Restore widget
    await expandBtn.click();
    await expect(page.locator('#chat-panel')).toBeVisible();

    // Escape key should minimize the widget
    await page.keyboard.press('Escape');
    await expect(page.locator('#chat-launcher-btn')).toBeVisible();
  });

  test('Enforces 2000 character hard limit on composer', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    const longText = 'a'.repeat(2100);
    await input.fill(longText);

    // Value should be clamped to 2000 characters
    const val = await input.inputValue();
    expect(val.length).toBe(2000);
  });

  test('T019: Mobile expanded layout acts as a modal overlay and backdrop closes it', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.locator('#chat-launcher-btn').click();
    await page.locator('#chat-expand-btn').click();

    // In mobile expanded mode, backdrop overlay should be present
    const backdrop = page.locator('#chat-modal-backdrop');
    await expect(backdrop).toBeVisible();

    // Clicking the backdrop in the margin returns to standard view
    await backdrop.click({ position: { x: 4, y: 4 } });
    await expect(backdrop).not.toBeVisible();
  });

  test('SC-004: Background graph interaction does not reset chat state', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');
    await input.fill('persistent query during graph manipulation');

    // Pan or click on the background canvas
    const canvas = page.locator('#cytoscape-container');
    if (await canvas.isVisible()) {
      await canvas.click({ position: { x: 100, y: 100 } });
    }

    // Chat draft should still be intact
    await expect(input).toHaveValue('persistent query during graph manipulation');
  });

  test('Quickstart Scenario 2: Sources Accordion and Clickable Citations', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    await input.fill('What is useState (React)?');
    await input.press('Enter');

    // Wait for sources accordion to appear
    const accordionToggle = page.locator('#sources-accordion-toggle');
    await expect(accordionToggle).toBeVisible({ timeout: 15000 });
    await expect(accordionToggle).toHaveAttribute('aria-expanded', 'false');

    // Sources accordion should be collapsed by default
    const sourceItem = page.locator('#source-item-1');
    await expect(sourceItem).not.toBeVisible();

    // Click citation button [1] in the text (LLM streaming response may take several seconds)
    const citationBtn = page.locator('#chat-message-viewport button').filter({ hasText: '[1]' });
    await expect(citationBtn.first()).toBeVisible({ timeout: 45000 });
    await citationBtn.first().click();

    // Accordion should now be expanded and source item visible
    await expect(accordionToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(sourceItem).toBeVisible();
    await expect(sourceItem).toContainText('[1]');
  });

  test('Quickstart Scenario 3: Stop Generating (cancellation)', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    await input.fill('Tell me a long story about graphs');
    await input.press('Enter');

    // Stop button should appear during streaming
    const stopBtn = page.locator('#chat-stop-btn');
    await expect(stopBtn).toBeVisible({ timeout: 2000 });

    // Click stop button
    await stopBtn.click();

    // Stop button should be replaced back by send button
    await expect(page.locator('#chat-send-btn')).toBeVisible();
    await expect(stopBtn).not.toBeVisible();
  });

  test('FR-005: Suggested prompts renew by fetching /random-topics upon user message submission', async ({ page }) => {
    await page.locator('#chat-launcher-btn').click();
    const input = page.locator('#chat-composer-input');

    // Wait for initial suggestions to be loaded
    await expect(page.getByText('Suggested queries')).toBeVisible();

    // Prepare listener for renewed /random-topics request when user message is sent
    const randomTopicsPromise = page.waitForRequest((request) =>
      request.url().includes('random-topics')
    );

    await input.fill('What is graph visualization?');
    await input.press('Enter');

    // Verify /random-topics was requested again
    const req = await randomTopicsPromise;
    expect(req.url()).toContain('random-topics');

    // Verify suggested queries remain visible with renewed suggestions
    await expect(page.getByText('Suggested queries')).toBeVisible();
  });
});

