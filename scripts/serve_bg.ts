// Starts the server in the background (detached) so the calling shell can return immediately.
// Writes the PID to logs/server.pid. Subsequent starts are no-ops if the server responds.

// Config
const port = Number(Deno.env.get("PORT")) || 8080;
const pidFile = "logs/server.pid";

async function isServerUp(): Promise<boolean> {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/`, { method: "GET" });
    return res.ok || res.status === 404; // treat 200/404 as responsive
  } catch (_) {
    return false;
  }
}

// Ensure logs directory exists for pid file
await Deno.mkdir("logs", { recursive: true });

if (await isServerUp()) {
  console.log(`Server already responding on port ${port}.`);
  Deno.exit(0);
}

// If a stale PID file exists, clean it up
try {
  const txt = await Deno.readTextFile(pidFile);
  const pid = Number(txt.trim());
  if (Number.isFinite(pid)) {
    // Best-effort check: if server is down but PID exists, just overwrite later.
  }
} catch (_) {
  // ignore missing pid file
}

const args = ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"];

const cmd = new Deno.Command(Deno.execPath(), {
  args,
  detached: true,
  stdin: "null",
  stdout: "null",
  stderr: "null",
});

const child = cmd.spawn();
// Detach so this script can exit while the child keeps running
child.unref();

await Deno.writeTextFile(pidFile, String(child.pid));
console.log(`Started server (pid ${child.pid}) on http://localhost:${port}`);

// Optionally wait briefly and report status
try {
  await new Promise((r) => setTimeout(r, 150));
  const isUp = await isServerUp();
  console.log(isUp ? "Status: responding" : "Status: starting up...");
} catch (_) {}
