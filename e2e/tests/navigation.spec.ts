import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test("sidebar has all navigation links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Pricing Engine")).toBeVisible();
    await expect(page.locator("a:has-text('Overview')")).toBeVisible();
    await expect(page.locator("a:has-text('Historial')")).toBeVisible();
    await expect(page.locator("a:has-text('Simulador')")).toBeVisible();
    await expect(page.locator("a:has-text('Recomendaciones')")).toBeVisible();
    await expect(page.locator("a:has-text('Passthrough')")).toBeVisible();
  });

  test("can navigate to all pages", async ({ page }) => {
    await page.goto("/");

    // Navigate to History
    await page.click("a:has-text('Historial')");
    await expect(page.locator("main h1")).toContainText("Historial");

    // Navigate to Simulator
    await page.click("a:has-text('Simulador')");
    await expect(page.locator("main h1")).toContainText("Simulador");

    // Navigate to Recommendations
    await page.click("a:has-text('Recomendaciones')");
    await expect(page.locator("main h1")).toContainText("Recomendaciones");

    // Navigate to Passthrough
    await page.click("a:has-text('Passthrough')");
    await expect(page.locator("main h1")).toContainText("Passthrough");

    // Back to Overview
    await page.click("a:has-text('Overview')");
    await expect(page.locator("main h1")).toContainText("Overview");
  });

  test("API health check responds", async ({ request }) => {
    const apiUrl = process.env.API_URL || "https://usg-backend-production.up.railway.app";
    const response = await request.get(`${apiUrl}/api/health`);
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body.status).toBe("ok");
  });
});
