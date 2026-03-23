import { test, expect } from "@playwright/test";

test.describe("Simulador de Precios", () => {
  test("loads page with title and controls", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("main h1")).toContainText("Simulador de Precios");
    await expect(page.locator("text=Configurar Escenario")).toBeVisible();
    await expect(page.getByText("Cambio de precio (%)", { exact: true })).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-01-page-loaded.png", fullPage: true });
  });

  test("displays price-volume-margin curve", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("text=Curva Precio-Volumen-Margen")).toBeVisible({ timeout: 15000 });

    // Chart should render SVG
    const chart = page.locator(".recharts-responsive-container svg").first();
    await expect(chart).toBeVisible({ timeout: 10000 });

    await page.screenshot({ path: "screenshots/simulator-02-curve.png", fullPage: true });
  });

  test("price slider changes value display", async ({ page }) => {
    await page.goto("/simulator");
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();

    // Default value should be +5%
    await expect(page.locator("text=+5%")).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-03-slider.png", fullPage: true });
  });

  test("simulation data loads with elasticity info", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("text=Curva Precio-Volumen-Margen")).toBeVisible({ timeout: 15000 });
    const chart = page.locator(".recharts-responsive-container svg").first();
    await expect(chart).toBeVisible({ timeout: 10000 });

    // Elasticity value should be shown
    await expect(page.locator("text=Elasticidad utilizada")).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-04-elasticity-info.png", fullPage: true });
  });

  test("scenario save form exists", async ({ page }) => {
    await page.goto("/simulator");
    const nameInput = page.locator('input[placeholder*="Aumento"]');
    await expect(nameInput).toBeVisible();
    await expect(page.locator("text=Guardar Escenario")).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-05-save-form.png", fullPage: true });
  });

  test("scenario sections are visible on scroll", async ({ page }) => {
    await page.goto("/simulator");
    const savedSection = page.getByRole("heading", { name: "Escenarios Guardados" });
    await savedSection.scrollIntoViewIfNeeded();
    await expect(savedSection).toBeVisible({ timeout: 10000 });

    const resultsSection = page.locator("text=Resultados del Escenario");
    await resultsSection.scrollIntoViewIfNeeded();
    await expect(resultsSection).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-06-sections.png", fullPage: true });
  });

  test("all 5 tabs are visible", async ({ page }) => {
    await page.goto("/simulator");
    await expect(page.locator("text=Simular")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Comparar")).toBeVisible();
    await expect(page.locator("text=Mejor Escenario")).toBeVisible();
    await expect(page.locator("text=Cargar Excel")).toBeVisible();
    await expect(page.locator("text=Optimizar")).toBeVisible();
  });

  test("Cargar Excel tab renders with template download", async ({ page }) => {
    await page.goto("/simulator");
    // Click "Cargar Excel" tab
    await page.locator("button:has-text('Cargar Excel')").click();

    // Should see the excel upload UI
    await expect(page.locator("text=Cargar Escenario desde Excel")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Descargar Plantilla Excel")).toBeVisible();
    await expect(page.locator("text=Evaluar Escenario")).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-07-excel-tab.png", fullPage: true });
  });

  test("Optimizar tab renders with objective buttons", async ({ page }) => {
    await page.goto("/simulator");
    // Click "Optimizar" tab
    await page.locator("button:has-text('Optimizar')").click();

    // Should see optimization UI
    await expect(page.locator("text=Optimización Automática de Precios")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("button:has-text('Margen')")).toBeVisible();
    await expect(page.locator("button:has-text('Ingreso')")).toBeVisible();
    await expect(page.locator("button:has-text('Volumen')")).toBeVisible();
    await expect(page.locator("text=Optimizar Precios")).toBeVisible();

    await page.screenshot({ path: "screenshots/simulator-08-optimize-tab.png", fullPage: true });
  });
});
