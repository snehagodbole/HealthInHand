import { expect, test } from "@playwright/test";
import { mockSignedOutSupabase } from "./support/supabase";

test.beforeEach(async ({ page }) => {
  await mockSignedOutSupabase(page);
});

test("landing page links to primary auth flows", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/HealthInHand/);
  await expect(
    page.getByRole("heading", { name: "HealthinHand" })
  ).toBeVisible();
  await expect(
    page.getByText("This app is for general wellness tracking only")
  ).toBeVisible();

  await page.getByRole("link", { name: "Get Started" }).click();
  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole("heading", { name: "Create your account" })
  ).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "I already have an account" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(
    page.getByRole("heading", { name: "Login to HealthInHand" })
  ).toBeVisible();
});

test("mobile navigation exposes signed-out auth links", async ({
  page,
  isMobile
}) => {
  test.skip(!isMobile, "Runs in the mobile browser profile only.");

  await page.goto("/");

  await page.getByRole("button", { name: "Open menu" }).click();

  await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" })).toBeVisible();

  await page.getByRole("link", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
