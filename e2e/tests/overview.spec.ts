import { test, expect } from "@playwright/test";

test.describe("Overview / Dashboard", () => {
  test("loads page with title and KPIs", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("main h1")).toContainText("Overview");
    await expect(page.locator("text=Resumen ejecutivo del portafolio analizado")).toBeVisible();

    // Wait for KPI cards to load (they show after API responds)
    await expect(page.locator("text=Ingreso Total")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Volumen Total")).toBeVisible();
    await expect(page.locator("text=Precio Neto Promedio")).toBeVisible();
  });

  test("displays charts with data", async ({ page }) => {
    await page.goto("/");
    // Wait for charts to render
    await expect(page.locator("text=Ingreso por Categoria")).toBeVisible({ timeout: 15000 });
    await expect(page.locator("text=Volumen por Segmento")).toBeVisible();
    await expect(page.locator("text=Ingreso por Territorio")).toBeVisible();

    // Recharts renders SVG elements — check they exist
    const svgs = page.locator(".recharts-responsive-container svg");
    await expect(svgs.first()).toBeVisible({ timeout: 10000 });
  });

  test("global filters are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Segmento", { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Territorio", { exact: true })).toBeVisible();
    await expect(page.getByText("Categoría", { exact: true })).toBeVisible();
    await expect(page.getByText("Distribuidor", { exact: true })).toBeVisible();
    await expect(page.locator("text=Limpiar filtros")).toBeVisible();
  });

  test("segment filter combobox works", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("text=Ingreso Total")).toBeVisible({ timeout: 15000 });

    // Click on the Segmento combobox to open it
    const segmentoLabel = page.getByText("Segmento", { exact: true });
    await expect(segmentoLabel).toBeVisible();

    // Click the combobox input area (sibling of the label)
    const segmentoBox = segmentoLabel.locator("..").locator("div").first();
    await segmentoBox.click();

    // The dropdown should show options
    await expect(page.locator("text=Oro")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("text=Plata")).toBeVisible();
    await expect(page.locator("text=Bronce")).toBeVisible();

    // Click "Oro" to select it
    await page.locator("text=Oro").click();

    // Data should still load (KPIs remain visible)
    await expect(page.locator("text=Ingreso Total")).toBeVisible({ timeout: 10000 });
  });
});
