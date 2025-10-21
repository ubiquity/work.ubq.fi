// Load environment variables from .env only in local/dev, not on Deno Deploy
if (!Deno.env.get("DENO_DEPLOYMENT_ID")) {
  await import("https://deno.land/std@0.224.0/dotenv/load.ts");
}
import { serveDir, serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

const requestedPort = Number(Deno.env.get("PORT"));
const port = Number.isFinite(requestedPort) ? requestedPort : 8080;
const serverPortFile = Deno.env.get("SERVER_PORT_FILE") ?? "logs/server.port";
const serverPidFile = Deno.env.get("SERVER_PID_FILE") ?? "logs/server.pid";

const kv = await Deno.openKv();

async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;
  console.log(`REQ ${request.method} ${pathname}`);

  // Handle CORS preflight globally to avoid 405 from static server
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  // API routes
  if (pathname === "/issue-scraper") {
    const { handleIssueScraper } = await import("./functions/issue-scraper.ts");
    return await handleIssueScraper(request);
  }
  if (pathname === "/referral-manager") {
    const { handleReferralManager } = await import("./functions/referral-manager.ts");
    return await handleReferralManager(request, kv);
  }

  // Static file serving from ./static with SPA fallback
  const res = await serveDir(request, {
    fsRoot: "static",
    // urlRoot intentionally omitted to serve from site root
    quiet: true,
  });

  // If file not found, fallback to index.html for SPA routes (GET only)
  if (res.status === 404 && request.method === "GET") {
    // Only fallback when expecting HTML
    const accept = request.headers.get("accept") || "";
    if (accept.includes("text/html")) {
      return await serveFile(request, "static/index.html");
    }
  }

  return res;
}

async function onListenCommon(hostname: string | undefined, port: number) {
  console.log(`Deno server listening on http://${hostname || "localhost"}:${port}`);
  try {
    await Deno.mkdir("logs", { recursive: true });
  } catch (_) {
    console.warn("Failed creating logs directory:", String(_));
  }
  try {
    await Deno.writeTextFile(serverPortFile, String(port));
  } catch (err) {
    console.warn("Failed writing server port file:", String(err));
  }
  try {
    await Deno.writeTextFile(serverPidFile, String(Deno.pid));
  } catch (err) {
    console.warn("Failed writing server pid file:", String(err));
  }
}

function start(portToUse: number) {
  try {
    Deno.serve(
      {
        port: portToUse,
        onListen: ({ hostname, port }) => onListenCommon(hostname, port),
      },
      handler
    );
  } catch (err) {
    // If the port is in use, retry with an ephemeral port
    const msg = (err && (err as Error).message) || "";
    const isAddrInUse = msg.includes("AddrInUse") || msg.includes("address already in use");
    if (isAddrInUse && portToUse !== 0) {
      console.warn(`Port ${portToUse} in use; retrying on an open port...`);
      Deno.serve(
        {
          port: 0,
          onListen: ({ hostname, port }) => onListenCommon(hostname, port),
        },
        handler
      );
      return;
    }
    throw err;
  }
}

start(port);
