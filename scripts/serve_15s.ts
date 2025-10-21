// Run the Deno HTTP server for ~15 seconds, then exit cleanly.
// - Binds to an ephemeral port (PORT=0) to avoid conflicts
// - Inherits stdout/stderr so logs are visible to the caller
// - Sends SIGTERM after timeout to stop the server

const TIMEOUT_SEC = Number(Deno.env.get("SERVE_TIMEOUT_SEC")) || 15;
const PORT = Deno.env.get("PORT") ?? "0"; // 0 = pick ephemeral port

console.log(`Starting server with ${TIMEOUT_SEC}s cap (PORT=${PORT}).`);

const server = new Deno.Command(Deno.execPath(), {
  args: ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
  stdout: "inherit",
  stderr: "inherit",
  env: { PORT },
});

const child = server.spawn();

// Race server completion vs timeout
const statusPromise = child.status;
const timeoutPromise = new Promise<"timeout">((resolve) => setTimeout(() => resolve("timeout"), TIMEOUT_SEC * 1000));

const winner = await Promise.race([statusPromise, timeoutPromise]);

if (winner === "timeout") {
  console.log(`Timeout reached (${TIMEOUT_SEC}s). Stopping server...`);
  try {
    child.kill("SIGTERM");
  } catch (_) {}
  // Wait briefly for graceful shutdown
  try {
    await Promise.race([statusPromise, new Promise((r) => setTimeout(r, 500))]);
  } catch (_) {}
  console.log("Server stopped.");
  Deno.exit(0);
} else {
  // Server exited before timeout; mirror its exit code
  Deno.exit(winner.code ?? 0);
}
