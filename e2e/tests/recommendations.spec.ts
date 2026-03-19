import { test, expect } from "@playwright/test";

test.describe("Recomendaciones", () => {
  test("loads page with title and export buttons", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("main h1")).toContainText("Recomendaciones");
    await expect(page.locator("text=Exportar CSV")).toBeVisible();
    await expect(page.locator("text=Informe Ejecutivo")).toBeVisible();
  });

  test("displays summary charts", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("text=Resumen por Segmento")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Metricas de Recomendaciones")).toBeVisible();
  });

  test("shows recommendation metrics", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("text=Total recomendaciones")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Alta confianza")).toBeVisible();
    await expect(page.locator("text=Oportunidades de aumento")).toBeVisible();
  });

  test("displays recommendations table with data", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("text=Detalle de Recomendaciones")).toBeVisible({ timeout: 15000 });

    // Table headers
    await expect(page.locator("th:has-text('Producto')")).toBeVisible();
    await expect(page.locator("th:has-text('Accion')")).toBeVisible();
    await expect(page.locator("th:has-text('Confianza')")).toBeVisible();

    // Table should have data rows
    const rows = page.locator("tbody tr");
    await expect(rows.first()).toBeVisible({ timeout: 10000 });
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test("recommendations show action badges", async ({ page }) => {
    await page.goto("/recommendations");
    await expect(page.locator("tbody tr").first()).toBeVisible({ timeout: 15000 });

    // Should have at least one badge with increase/protect/decrease
    const badges = page.locator("tbody span");
    await expect(badges.first()).toBeVisible();
  });
});
