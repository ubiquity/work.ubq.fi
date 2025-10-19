// Start server in background if needed, then wait up to TIMEOUT seconds
// for it to respond, and exit regardless (so Codex isn’t blocked).

const DEFAULT_TIMEOUT_SEC = Number(Deno.env.get("SERVE_WAIT_TIMEOUT_SEC")) || 15;
const portFile = Deno.env.get("SERVER_PORT_FILE") ?? "logs/server.port";
let port = Number(Deno.env.get("PORT")) || 8080;
const timeoutMs = DEFAULT_TIMEOUT_SEC * 1000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } catch (_) {
    return null;
  } finally {
    clearTimeout(tid);
  }
}

async function isUp(): Promise<boolean> {
  // Prefer port from file if created by server on listen
  try {
    const txt = await Deno.readTextFile(portFile);
    const p = Number(txt.trim());
    if (Number.isFinite(p)) port = p;
  } catch (_) {}
  const res = await fetchWithTimeout(`http://127.0.0.1:${port}/`, 800);
  if (!res) return false;
  return res.ok || res.status === 404; // treat 200/404 as responsive
}

// If not up, trigger background start (idempotent)
if (!(await isUp())) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--allow-run", "--allow-read", "--allow-write", "--allow-env", "--allow-net", "scripts/serve_bg.ts"],
    stdin: "null",
    stdout: "null",
    stderr: "null",
    detached: true,
  });
  const child = cmd.spawn();
  child.unref();
}

const start = Date.now();
let isReady = false;
while (Date.now() - start < timeoutMs) {
  if (await isUp()) {
    isReady = true;
    break;
  }
  await sleep(300);
}

if (isReady) {
  console.log(`READY: http://localhost:${port}`);
  Deno.exit(0);
} else {
  console.log(`STARTING: server not responding yet after ${DEFAULT_TIMEOUT_SEC}s`);
  // Exit 0 to avoid blocking upstream orchestration
  Deno.exit(0);
}
