import { test, expect } from "@playwright/test";

test.describe("Historial / Elasticidades", () => {
  test("loads page with title and charts", async ({ page }) => {
    await page.goto("/history");
    await expect(page.locator("main h1")).toContainText("Historial y Elasticidades");
    await expect(page.locator("text=Lectura backward-looking")).toBeVisible();
  });

  test("displays trend chart", async ({ page }) => {
    await page.goto("/history");
    await expect(page.locator("text=Tendencia Precio Neto y Volumen")).toBeVisible({ timeout: 15000 });
  });

  test("displays price-volume scatter", async ({ page }) => {
    await page.goto("/history");
    await expect(page.locator("text=Precio vs Volumen")).toBeVisible({ timeout: 15000 });
  });

  test("displays elasticities table", async ({ page }) => {
    await page.goto("/history");
    await expect(page.locator("text=Elasticidades Historicas")).toBeVisible({ timeout: 15000 });

    // Table should have header columns
    await expect(page.locator("th:has-text('Coeficiente')")).toBeVisible();
    await expect(page.locator("th:has-text('Confianza')")).toBeVisible();

    // Table should have data rows
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
  });

  test("analysis level selector works", async ({ page }) => {
    await page.goto("/history");
    // "Nivel de análisis" is now the first native <select> (global filters are ComboBoxes)
    const analysisSelect = page.locator("select").first();
    await expect(analysisSelect).toBeVisible({ timeout: 10000 });
    await analysisSelect.selectOption("sku");
    // Page should still render
    await expect(page.locator("text=Elasticidades Historicas")).toBeVisible({ timeout: 10000 });
  });

  test("confidence filter is present in history", async ({ page }) => {
    await page.goto("/history");
    // Confidence filter is the second native <select> on history page
    const confidenceSelect = page.locator("select").nth(1);
    await expect(confidenceSelect).toBeVisible({ timeout: 10000 });
    await confidenceSelect.selectOption("high");
    await expect(page.locator("text=Elasticidades Historicas")).toBeVisible({ timeout: 10000 });
  });
});
