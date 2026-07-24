import { expect, test } from "@playwright/test";
import {
  mockFailedPasswordLogin,
  mockSignedOutSupabase,
  mockSuccessfulPasswordLogin,
  mockSignupRequiringEmailConfirmation
} from "./support/supabase";

test.beforeEach(async ({ page }) => {
  await mockSignedOutSupabase(page);
});

test("login displays a Supabase password error", async ({ page }) => {
  await mockFailedPasswordLogin(page);
  await page.goto("/login?redirectedFrom=/progress");

  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page.getByText("Invalid login credentials")).toBeVisible();
  await expect(page).toHaveURL(/\/login\?redirectedFrom=\/progress$/);
});

test("login ignores external redirectedFrom values", async ({ page }) => {
  await mockSuccessfulPasswordLogin(page);
  await page.goto(
    "/login?redirectedFrom=https%3A%2F%2Fexample.com%2Fsteal-session"
  );

  await page.getByLabel("Email").fill("person@example.com");
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(
    /(?:\/dashboard|\/login\?redirectedFrom=%2Fdashboard)$/
  );
  expect(page.url()).not.toContain("example.com");

  const finalUrl = new URL(page.url());
  expect(finalUrl.hostname).toMatch(/^(127\.0\.0\.1|localhost)$/);
  expect(finalUrl.searchParams.get("redirectedFrom")).not.toContain("example");
});

test("signup displays confirmation guidance when email confirmation is required", async ({
  page
}) => {
  await mockSignupRequiringEmailConfirmation(page);
  await page.goto("/signup");

  await page.getByLabel("Email").fill("new-person@example.com");
  await page.getByLabel("Password").fill("healthy-habit");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(
    page.getByText("Check your email to confirm your account, then log in.")
  ).toBeVisible();
});
