import { expect, test } from "@playwright/test";

function toDateTimeLocalValue(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

test("user can login, start a fast, end it, and see it in history", async ({
  page
}, testInfo) => {
  const email =
    `fasting-flow-${testInfo.project.name}-${testInfo.workerIndex}-${testInfo.retry}` +
    "@example.com";

  await page.goto("/login");

  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-password");
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  await expect(
    page.getByRole("heading", { name: "Eating Window" })
  ).toBeVisible();

  await page
    .getByLabel("Start time")
    .fill(toDateTimeLocalValue(new Date(Date.now() - 5 * 60 * 1000)));
  await page.getByRole("button", { name: "Start Fast" }).click();

  await expect(page.getByRole("heading", { name: "Fasting" })).toBeVisible();
  await expect(page.getByText("Fast in progress")).toBeVisible();

  await page.getByRole("button", { name: "End Fast" }).click();

  await expect(
    page.getByRole("heading", { name: "Eating Window" })
  ).toBeVisible();
  await expect(page.getByText("No active fast")).toBeVisible();

  await page.goto("/history");

  await expect(
    page.getByRole("heading", { name: "Completed fasts" })
  ).toBeVisible();
  await expect(page.getByText(/[1-9]\d*m/)).toBeVisible();
});
