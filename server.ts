// Load environment variables from .env in development
import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleIssueScraper } from "./functions/issue-scraper.ts";
import { handleReferralManager } from "./functions/referral-manager.ts";

const port = Number(Deno.env.get("PORT")) || 8080;

const kv = await Deno.openKv();

Deno.serve({ port }, async (request: Request): Promise<Response> => {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API routes
  if (pathname === "/issue-scraper") {
    return await handleIssueScraper(request);
  }
  if (pathname === "/referral-manager") {
    return await handleReferralManager(request, kv);
  }

  // Static file serving from ./static
  return await serveDir(request, {
    fsRoot: "static",
    urlRoot: "/",
    quiet: true,
  });
});

console.log(`Deno server listening on http://localhost:${port}`);

