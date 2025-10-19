// Minimal Deno static server for local dev
// Serves files from ./static with SPA fallback to index.html

import { serveDir } from "https://deno.land/std@0.224.0/http/file_server.ts";
import { handleIssueScraper, corsHeaders } from "../server/api/issue-scraper.ts";

const port = Number(Deno.env.get("PORT") ?? "8080");
const host = "0.0.0.0";

console.log(`Deno server listening on http://${host}:${port}`);

Deno.serve({ hostname: host, port }, async (req: Request) => {
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
});
