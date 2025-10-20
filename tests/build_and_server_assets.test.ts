/// <reference lib="deno.ns" />
import { assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

async function runBuild(): Promise<void> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", "build/esbuild-build.ts"],
    stdout: "inherit",
    stderr: "inherit",
    env: {
      SUPABASE_URL: Deno.env.get("SUPABASE_URL") ?? "https://example.supabase.co",
      SUPABASE_ANON_KEY: Deno.env.get("SUPABASE_ANON_KEY") ?? "anon-key",
    },
  });
  const { code } = await cmd.output();
  assertEquals(code, 0);
}

async function startServer(): Promise<{ child: Deno.ChildProcess; port: number }> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
    stdout: "piped",
    stderr: "null",
    env: { PORT: "0" },
  });
  const child = cmd.spawn();
  const td = new TextDecoder();
  const reader = child.stdout.getReader();
  let buf = "";
  const timeoutMs = 7000;
  let port: number | undefined;
  async function readWithTimeout(ms: number) {
    const timer = new Promise<{ timeout: true }>((resolve) => setTimeout(() => resolve({ timeout: true }), ms));
    const read = reader.read();
    return (await Promise.race([read, timer])) as ReadableStreamReadResult<Uint8Array> | { timeout: true };
  }
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const remaining = Math.max(1, timeoutMs - (Date.now() - start));
    const res = await readWithTimeout(remaining);
    if ((res as { timeout: true }).timeout) break;
    const { value, done: isDone } = res as ReadableStreamReadResult<Uint8Array>;
    if (isDone) break;
    buf += td.decode(value);
    const m = buf.match(/listening on http:\/\/[^:]+:(\d+)/i);
    if (m) {
      port = Number(m[1]);
      break;
    }
  }
  try {
    reader.releaseLock();
  } catch (_) {}
  if (!port) {
    try {
      child.kill("SIGTERM");
    } catch (_) {}
    throw new Error("Failed to determine server port from output within timeout: " + buf.slice(-200));
  }
  return { child, port };
}

async function stopServer(child: Deno.ChildProcess) {
  try {
    child.kill("SIGTERM");
  } catch (_) {}
  try {
    await Promise.race([child.status, new Promise((r) => setTimeout(r, 1000))]);
  } catch (_) {}
}

Deno.test({
  name: "build then serve: dist JS and inverted CSS are available",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    await runBuild();
    const { child, port } = await startServer();
    const base = `http://127.0.0.1:${port}`;
    try {
      const timeoutMs = 5000;
      const fetchT = (input: string | URL, init: RequestInit = {}) => fetch(input, { signal: AbortSignal.timeout(timeoutMs), ...init });

      const resJs = await fetchT(base + "/dist/src/home/home.js");
      assertEquals(resJs.status, 200);
      assertStringIncludes((resJs.headers.get("content-type") || "").toLowerCase(), "javascript");

      const resCss = await fetchT(base + "/style/inverted-style.css");
      assertEquals(resCss.status, 200);
      assertStringIncludes((resCss.headers.get("content-type") || "").toLowerCase(), "text/css");
    } finally {
      await stopServer(child);
    }
  },
});
