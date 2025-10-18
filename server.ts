// Load environment variables from .env in development
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { serveDir, serveFile } from "https://deno.land/std@0.224.0/http/file_server.ts";

const port = Number(Deno.env.get("PORT")) || 8080;

const kv = await Deno.openKv();

Deno.serve({ port }, async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const pathname = url.pathname;
  console.log(`REQ ${request.method} ${pathname}`);

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
    urlRoot: "/",
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
});

console.log(`Deno server listening on http://localhost:${port}`);
