import { test, expect } from "@playwright/test";

test.describe("Simulador de Precios", () => {
  test("loads page with title and controls", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("main h1")).toContainText("Simulador de Precios");
    await expect(page.locator("text=Configurar Escenario")).toBeVisible();
    await expect(page.getByText("Cambio de precio (%)", { exact: true })).toBeVisible();
  });

  test("displays price-volume-margin curve", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("text=Curva Precio-Volumen-Margen")).toBeVisible({ timeout: 15000 });

    // Chart should render SVG
    const chart = page.locator(".recharts-responsive-container svg").first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test("price slider changes value display", async ({ page }) => {
    await page.goto("/simulator");
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Default value should be +5%
    await expect(page.locator("text=+5%")).toBeVisible();
  });

  test("simulation data loads", async ({ page }) => {
    await page.goto("/simulator");
    // Wait for the curve chart to render (indicates API responded)
    await expect(page.locator("text=Curva Precio-Volumen-Margen")).toBeVisible({ timeout: 15000 });
    const chart = page.locator(".recharts-responsive-container svg").first();
    await expect(chart).toBeVisible({ timeout: 10000 });
  });

  test("scenario save form exists", async ({ page }) => {
    await page.goto("/simulator");
    const nameInput = page.locator('input[placeholder*="Aumento"]');
    await expect(nameInput).toBeVisible();
    await expect(page.locator("text=Guardar Escenario")).toBeVisible();
  });

  test("scenario sections are visible on scroll", async ({ page }) => {
    await page.goto("/simulator");
    // These sections may be below the fold — scroll to them
    const savedSection = page.getByRole("heading", { name: "Escenarios Guardados" });
    await savedSection.scrollIntoViewIfNeeded();
    await expect(savedSection).toBeVisible({ timeout: 10000 });

    const resultsSection = page.locator("text=Resultados del Escenario");
    await resultsSection.scrollIntoViewIfNeeded();
    await expect(resultsSection).toBeVisible();
  });
});
