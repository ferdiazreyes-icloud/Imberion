import { test, expect } from "@playwright/test";

test.describe("Passthrough y Rebates", () => {
  test("loads page with title", async ({ page }) => {
    await page.goto("/passthrough");
    await expect(page.locator("main h1")).toContainText("Passthrough y Rebates");
    await expect(page.locator("text=Analisis de precio lista")).toBeVisible();
  });

  test("displays price decomposition chart", async ({ page }) => {
    await page.goto("/passthrough");
    await expect(page.locator("text=Descomposicion de Precio por Segmento")).toBeVisible({ timeout: 15000 });

    // Chart should render
    const chart = page.locator(".recharts-responsive-container svg").first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test("displays rebate percentage section", async ({ page }) => {
    await page.goto("/passthrough");
    await expect(page.locator("text=Rebate como % del Precio Lista")).toBeVisible({ timeout: 15000 });
  });

  test("displays rebate by category chart", async ({ page }) => {
    await page.goto("/passthrough");
    await expect(page.locator("text=Rebate Promedio por Categoria")).toBeVisible({ timeout: 15000 });
  });

  test("displays price evolution chart", async ({ page }) => {
    await page.goto("/passthrough");
    await expect(page.locator("text=Evolucion de Componentes de Precio")).toBeVisible({ timeout: 15000 });
  });
});
