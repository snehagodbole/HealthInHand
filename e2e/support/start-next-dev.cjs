/* eslint-env node */

const { spawn } = require("node:child_process");
const path = require("node:path");

const port = process.env.PORT ?? "3100";
const nextBin = require.resolve("next/dist/bin/next");

const child = spawn(
  process.execPath,
  [nextBin, "dev", "-p", port, "-H", "127.0.0.1"],
  {
    cwd: path.resolve(__dirname, "../.."),
    env: {
      ...process.env,
      NODE_ENV: "development",
      PORT: port
    },
    stdio: "inherit"
  }
);

function shutdown(signal) {
  if (!child.killed) {
    child.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});
