/* eslint-env node */

const http = require("node:http");
const { randomUUID } = require("node:crypto");
const { URL } = require("node:url");

const port = Number(process.env.PORT ?? 54329);
const usersByEmail = new Map();
const emailsByToken = new Map();
const emailsByRefreshToken = new Map();

function send(request, response, status, body = null, extraHeaders = {}) {
  const payload = body === null ? "" : JSON.stringify(body);
  const requestedHeaders =
    request.headers["access-control-request-headers"] ??
    "authorization, apikey, content-type, prefer, x-client-info";

  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": requestedHeaders,
    "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "access-control-allow-private-network": "true",
    "content-type": "application/json",
    vary: "Access-Control-Request-Headers",
    ...extraHeaders
  });
  response.end(payload);
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function hashEmail(email) {
  let hash = 0;
  for (const character of email) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }
  return String(hash).padStart(12, "0").slice(-12);
}

function getOrCreateUser(email) {
  const normalizedEmail = String(email ?? "e2e@example.com").toLowerCase();
  const existing = usersByEmail.get(normalizedEmail);

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const id = `00000000-0000-4000-8000-${hashEmail(normalizedEmail)}`;
  const user = {
    id,
    aud: "authenticated",
    role: "authenticated",
    email: normalizedEmail,
    phone: "",
    app_metadata: {
      provider: "email",
      providers: ["email"]
    },
    user_metadata: {},
    identities: [],
    created_at: now,
    updated_at: now
  };

  const account = {
    user,
    profile: {
      id,
      email: normalizedEmail,
      fasting_plan: "16:8",
      fasting_hours_goal: 16,
      eating_hours_goal: 8,
      created_at: now
    },
    fasting_sessions: [],
    weight_measurements: []
  };

  usersByEmail.set(normalizedEmail, account);
  return account;
}

function getAuthenticatedAccount(request) {
  const authHeader = request.headers.authorization ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  const email = emailsByToken.get(token);

  return email ? usersByEmail.get(email) : null;
}

function createSessionPayload(account) {
  const accessToken = `test-access-token-${encodeURIComponent(
    account.user.email
  )}`;
  const refreshToken = `test-refresh-token-${encodeURIComponent(
    account.user.email
  )}`;

  emailsByToken.set(accessToken, account.user.email);
  emailsByRefreshToken.set(refreshToken, account.user.email);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: account.user
  };
}

function getSingleMode(request) {
  const accept = request.headers.accept ?? "";
  return accept.includes("application/vnd.pgrst.object+json");
}

function matchEq(searchParams, key, value) {
  const filter = searchParams.get(key);
  return !filter || filter === `eq.${value}`;
}

function selectColumns(rows, select) {
  if (!select || select === "*") {
    return rows;
  }

  const columns = select.split(",").map((column) => column.trim());
  return rows.map((row) =>
    columns.reduce((selected, column) => {
      selected[column] = row[column];
      return selected;
    }, {})
  );
}

function queryRows(table, account, requestUrl) {
  const params = requestUrl.searchParams;
  let rows = account[table] ?? [];

  if (table === "profiles") {
    rows = [account.profile];
  }

  if (params.has("id")) {
    const id = params.get("id").replace(/^eq\./, "");
    rows = rows.filter((row) => row.id === id);
  }

  if (params.has("user_id")) {
    const userId = params.get("user_id").replace(/^eq\./, "");
    rows = rows.filter((row) => row.user_id === userId);
  }

  if (params.has("status")) {
    const status = params.get("status").replace(/^eq\./, "");
    rows = rows.filter((row) => row.status === status);
  }

  if (params.has("order")) {
    const [column, direction] = params.get("order").split(".");
    rows = [...rows].sort((left, right) => {
      const leftValue = left[column] ?? "";
      const rightValue = right[column] ?? "";
      return direction === "desc"
        ? String(rightValue).localeCompare(String(leftValue))
        : String(leftValue).localeCompare(String(rightValue));
    });
  }

  return selectColumns(rows, params.get("select"));
}

function createSession(account, body) {
  const now = new Date().toISOString();
  const activeSession = account.fasting_sessions.find(
    (session) => session.status === "active"
  );

  if (activeSession) {
    return {
      error: {
        message: "duplicate key value violates unique constraint",
        code: "23505"
      }
    };
  }

  const session = {
    id: randomUUID(),
    user_id: body.user_id,
    shared_fast_id: body.shared_fast_id ?? null,
    start_time: body.start_time ?? now,
    end_time: body.end_time ?? null,
    duration_minutes: body.duration_minutes ?? null,
    status: body.status ?? "active",
    created_at: now
  };

  account.fasting_sessions.push(session);
  return { session };
}

async function handleAuth(request, response, requestUrl) {
  if (
    request.method === "POST" &&
    requestUrl.pathname === "/auth/v1/token" &&
    requestUrl.searchParams.get("grant_type") === "password"
  ) {
    const body = await readJson(request);
    const account = getOrCreateUser(body.email);

    send(request, response, 200, createSessionPayload(account));
    return true;
  }

  if (
    request.method === "POST" &&
    requestUrl.pathname === "/auth/v1/token" &&
    requestUrl.searchParams.get("grant_type") === "refresh_token"
  ) {
    const body = await readJson(request);
    const email = emailsByRefreshToken.get(body.refresh_token);
    const account = email ? usersByEmail.get(email) : null;

    if (!account) {
      send(request, response, 400, {
        error: "invalid_grant",
        error_description: "Invalid refresh token"
      });
      return true;
    }

    send(request, response, 200, createSessionPayload(account));
    return true;
  }

  if (request.method === "GET" && requestUrl.pathname === "/auth/v1/user") {
    const account = getAuthenticatedAccount(request);

    if (!account) {
      send(request, response, 401, {
        message: "Missing bearer token"
      });
      return true;
    }

    send(request, response, 200, account.user);
    return true;
  }

  return false;
}

async function handleRest(request, response, requestUrl) {
  if (!requestUrl.pathname.startsWith("/rest/v1/")) {
    return false;
  }

  const account = getAuthenticatedAccount(request);
  if (!account) {
    send(request, response, 401, {
      message: "Missing bearer token"
    });
    return true;
  }

  const table = requestUrl.pathname.replace("/rest/v1/", "");

  if (request.method === "GET") {
    const rows = queryRows(table, account, requestUrl);

    if (getSingleMode(request)) {
      send(request, response, 200, rows[0] ?? null);
      return true;
    }

    send(request, response, 200, rows);
    return true;
  }

  if (request.method === "POST" && table === "fasting_sessions") {
    const body = await readJson(request);
    const result = createSession(account, body);

    if (result.error) {
      send(request, response, 409, result.error);
      return true;
    }

    send(request, response, 201, null);
    return true;
  }

  if (request.method === "PATCH" && table === "fasting_sessions") {
    const body = await readJson(request);
    const session = account.fasting_sessions.find(
      (candidate) =>
        matchEq(requestUrl.searchParams, "id", candidate.id) &&
        matchEq(requestUrl.searchParams, "user_id", candidate.user_id) &&
        matchEq(requestUrl.searchParams, "status", candidate.status)
    );

    if (session) {
      Object.assign(session, body);
    }

    send(request, response, 204, null);
    return true;
  }

  send(request, response, 404, {
    message: `Unhandled table ${table}`
  });
  return true;
}

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      send(request, response, 204);
      return;
    }

    const requestUrl = new URL(request.url, `http://127.0.0.1:${port}`);

    if (
      requestUrl.pathname === "/" &&
      (request.method === "GET" || request.method === "HEAD")
    ) {
      send(request, response, 200, {
        ok: true
      });
      return;
    }

    if (await handleAuth(request, response, requestUrl)) {
      return;
    }

    if (await handleRest(request, response, requestUrl)) {
      return;
    }

    send(request, response, 404, {
      message: `Unhandled ${request.method} ${requestUrl.pathname}`
    });
  } catch (error) {
    send(request, response, 500, {
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock Supabase server listening on http://127.0.0.1:${port}`);
});
