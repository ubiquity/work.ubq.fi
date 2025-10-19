/// <reference lib="deno.ns" />
import { assert, assertEquals, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";

async function startServer(): Promise<{ child: Deno.ChildProcess; port: number }> {
  const cmd = new Deno.Command(Deno.execPath(), {
    args: ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
    stdout: "piped",
    stderr: "piped",
    env: { PORT: "0" },
  });

  const child = cmd.spawn();

  const reader = child.stdout.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const deadline = Date.now() + 7000;
  let port: number | undefined;

  while (Date.now() < deadline) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value);
    const m = buf.match(/listening on http:\/\/[^:]+:(\d+)/i);
    if (m) {
      port = Number(m[1]);
      break;
    }
  }
  try {
    reader.releaseLock();
  } catch (_) {
    // ignore
  }

  if (!port) {
    try {
      child.kill("SIGTERM");
    } catch (_) {}
    throw new Error("Failed to determine server port from output: " + buf.slice(-200));
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
      // index.html via root
      const resIndex = await fetch(base + "/", { headers: { accept: "text/html" } });
      assertEquals(resIndex.status, 200);
      const html = await resIndex.text();
      assertStringIncludes(html.toLowerCase(), "<!doctype html>");

      // CSS asset
      const resCss = await fetch(base + "/style/style.css");
      assertEquals(resCss.status, 200);
      assertStringIncludes(resCss.headers.get("content-type") || "", "text/css");
      const css = await resCss.text();
      assertStringIncludes(css, "#issues-container");

      // SVG asset
      const resSvg = await fetch(base + "/favicon.svg");
      assertEquals(resSvg.status, 200);
      assertStringIncludes(resSvg.headers.get("content-type") || "", "image/svg+xml");

      // Plain 404 for non-HTML unknown file
      const res404 = await fetch(base + "/nope.txt");
      assertEquals(res404.status, 404);
    } finally {
      await stopServer(child);
    }
  },
});
