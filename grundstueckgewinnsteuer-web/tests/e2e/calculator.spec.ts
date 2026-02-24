import { test, expect } from "@playwright/test";

test.describe("Calculator E2E", () => {
    test("should load the calculator page", async ({ page }) => {
        await page.goto("/");
        await expect(page.locator("h1")).toContainText("Grundstückgewinnsteuer");
    });

    test("should have canton selector with all 26 cantons", async ({ page }) => {
        await page.goto("/");
        const options = await page.locator("#canton-select option").count();
        expect(options).toBe(26);
    });

    test("should compute tax for SH", async ({ page }) => {
        await page.goto("/");

        // Select SH canton (default)
        await page.selectOption("#canton-select", "SH");

        // Fill in dates
        await page.fill("#purchase-date", "2015-01-01");
        await page.fill("#sale-date", "2025-06-15");

        // Fill in prices
        await page.fill("#purchase-price", "500000");
        await page.fill("#sale-price", "700000");

        // Click compute
        await page.click("#compute-button");

        // Should show results
        await expect(page.locator("text=Zusammenfassung")).toBeVisible();
    });

    test("should navigate to sources page", async ({ page }) => {
        await page.goto("/sources");
        await expect(page.locator("h1")).toContainText("Datenquellen");
    });

    test("should navigate to about page", async ({ page }) => {
        await page.goto("/about");
        await expect(page.locator("h1")).toContainText("Über");
    });
});
