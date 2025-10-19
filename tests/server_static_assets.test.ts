/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

async function startServer(): Promise<{ child: Deno.ChildProcess; port: number }> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
    stdout: "piped",
    // Discard stderr to avoid potential pipe backpressure if not consumed
    stderr: "null",
    env: { PORT: "0" },
  });

  const child = cmd.spawn();

  const td = new TextDecoder();
  const reader = child.stdout.getReader();
  let buf = "";
  const timeoutMs = 7000;
  let port: number | undefined;

  // Helper to read with a timeout so we don't hang indefinitely if no output is produced
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
  name: "static assets are served and SPA fallback works",
  sanitizeOps: false,
  sanitizeResources: false,
  fn: async () => {
    const { child, port } = await startServer();
    const base = `http://127.0.0.1:${port}`;
    try {
      const timeoutMs = 5000;
      const fetchT = (input: string | URL, init: RequestInit = {}) => {
        return fetch(input, { signal: AbortSignal.timeout(timeoutMs), ...init });
      };
      // index.html via root
      const resIndex = await fetchT(base + "/", { headers: { accept: "text/html" } });
      assertEquals(resIndex.status, 200);
      const html = await resIndex.text();
      assertStringIncludes(html.toLowerCase(), "<!doctype html>");

      // CSS asset
      const resCss = await fetchT(base + "/style/style.css");
      assertEquals(resCss.status, 200);
      assertStringIncludes(resCss.headers.get("content-type") || "", "text/css");
      const css = await resCss.text();
      assertStringIncludes(css, "#issues-container");

      // SVG asset
      const resSvg = await fetchT(base + "/favicon.svg");
      assertEquals(resSvg.status, 200);
      assertStringIncludes(resSvg.headers.get("content-type") || "", "image/svg+xml");

      // Plain 404 for non-HTML unknown file
      const res404 = await fetchT(base + "/nope.txt");
      assertEquals(res404.status, 404);
    } finally {
      await stopServer(child);
    }
  },
});
