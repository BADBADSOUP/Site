const { test, expect } = require('@playwright/test');
test('Verify homepage loads and transitions work', async ({ page }) => {
  await page.goto('http://localhost:3000/');
  await expect(page.locator('h1')).toBeVisible();
});