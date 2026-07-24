import type { Page } from "@playwright/test";

export async function mockSignedOutSupabase(page: Page) {
  await page.route("**/auth/v1/user", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({
        message: "Missing bearer token"
      })
    });
  });
}

export async function mockFailedPasswordLogin(page: Page) {
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        error: "invalid_grant",
        error_description: "Invalid login credentials"
      })
    });
  });
}

export async function mockSuccessfulPasswordLogin(page: Page) {
  await page.route("**/auth/v1/token?grant_type=password", async (route) => {
    const requestBody = route.request().postDataJSON();
    const now = new Date().toISOString();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        token_type: "bearer",
        user: {
          id: "00000000-0000-4000-8000-000000000002",
          aud: "authenticated",
          role: "authenticated",
          email: requestBody.email,
          phone: "",
          app_metadata: {
            provider: "email",
            providers: ["email"]
          },
          user_metadata: {},
          identities: [],
          created_at: now,
          updated_at: now
        }
      })
    });
  });
}

export async function mockSignupRequiringEmailConfirmation(page: Page) {
  await page.route("**/auth/v1/signup**", async (route) => {
    const requestBody = route.request().postDataJSON();

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: "00000000-0000-4000-8000-000000000001",
        aud: "authenticated",
        role: "authenticated",
        email: requestBody.email,
        phone: "",
        confirmation_sent_at: new Date().toISOString(),
        app_metadata: {
          provider: "email",
          providers: ["email"]
        },
        user_metadata: {},
        identities: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
  });
}
