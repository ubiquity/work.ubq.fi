// Minimal Deno static server for local dev
// Serves files from ./static with SPA fallback to index.html

import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { corsHeaders, handleIssueScraper } from "../server/api/issue-scraper.ts";

const port = Number(Deno.env.get("PORT") ?? "8080");
const host = "0.0.0.0";

async function killProcessesOnPort(p: number): Promise<boolean> {
  // Only attempt in dev when run permission is granted.
  try {
    const perm = await Deno.permissions.query({ name: "run" as const });
    if (perm.state !== "granted") return false;

    const cmd = new Deno.Command("lsof", {
      args: ["-i", ":" + String(p), "-sTCP:LISTEN", "-t"],
      stdout: "piped",
      stderr: "piped",
    });
    const out = await cmd.output();
    const pidsText = new TextDecoder().decode(out.stdout).trim();
    if (!pidsText) return false;

    const pids = pidsText
      .split(/\s+/)
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n > 0 && n !== Deno.pid);

    if (pids.length === 0) return false;

    for (const pid of pids) {
      try {
        // Try graceful first, then force.
        Deno.kill(pid, "SIGTERM");
      } catch (_) {
        // ignore
      }
    }
    // Give processes a moment to exit gracefully
    await new Promise((r) => setTimeout(r, 300));

    // If still present, force kill
    for (const pid of pids) {
      try {
        Deno.kill(pid, "SIGKILL");
      } catch (_) {
        // ignore
      }
    }

    // Short delay to let OS release the socket
    await new Promise((r) => setTimeout(r, 200));
    return true;
  } catch (_) {
    // lsof may not exist or run may not be permitted
    return false;
  }
}

async function start() {
  console.log(`Deno server listening on http://${host}:${port}`);
  try {
    Deno.serve({ hostname: host, port }, handler);
  } catch (e) {
    if (e instanceof Deno.errors.AddrInUse) {
      console.error(`Port ${port} in use. Attempting to free it...`);
      const killed = await killProcessesOnPort(port);
      if (killed) {
        console.log(`Retrying to bind http://${host}:${port} ...`);
        // Retry once after killing
        Deno.serve({ hostname: host, port }, handler);
        return;
      }
      console.error(
        `Unable to free port ${port}. If running manually, stop the existing process or rerun with --allow-run to enable auto-kill in dev.`,
      );
    }
    throw e;
  }
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/issue-scraper") {
    return handleIssueScraper(req);
  }

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  const res = await serveDir(req, {
    fsRoot: "static",
    urlRoot: "/",
    quiet: true,
    enableCors: true,
    showDirListing: false,
  });

  if (res.status === 404 && req.method === "GET") {
    // SPA fallback for client-side routes
    try {
      const html = await Deno.readFile("static/index.html");
      return new Response(html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    } catch (_) {
      return res;
    }
  }

  return res;
}

await start();
