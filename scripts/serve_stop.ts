// Stops the background server started by scripts/serve_bg.ts using the stored PID.
const pidFile = "logs/server.pid";

let pid: number | null = null;
try {
  const txt = await Deno.readTextFile(pidFile);
  pid = Number(txt.trim());
  if (!Number.isFinite(pid)) pid = null;
} catch (err) {
  if (err as Deno.errors.NotFound) {
    console.error("No pid file found; is the server running?");
    Deno.exit(1);
  }
  throw err;
}

if (pid == null) {
  console.error("Invalid pid file.");
  Deno.exit(1);
}

try {
  // Send SIGTERM first
  Deno.kill(pid, "SIGTERM");
  // Wait a moment for graceful shutdown
  await new Promise((r) => setTimeout(r, 200));
} catch (err) {
  console.error(`Failed to signal process ${pid}:`, err);
}

// Clean up pid file regardless
try {
  await Deno.remove(pidFile);
} catch (_) {}

console.log(`Signaled server pid ${pid} to stop.`);
