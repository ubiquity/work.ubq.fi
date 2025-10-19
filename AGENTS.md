# Project Agents Guide — Deno Only

This repository runs on a pure Deno HTTP server. Do not add or rely on Cloudflare Wrangler, Cloudflare Workers, or Pages dev tooling. Any remaining references to Wrangler/Cloudflare are legacy and must be removed when touched.

## Deno-Only Runtime
- Use a Deno server for local dev and prod. No Wrangler.
- Serve the built static assets from `static/`.
- PWA service worker in `static/progressive-web-app.js` is a browser service worker (not Cloudflare).

## Local Development
- Build assets: `deno task build` (or `deno task watch` while developing).
- Start server: `deno run --allow-net --allow-read --allow-env=PORT scripts/deno_static_server.ts`.
- Default port is `8080` (override with `PORT=<number>`).

## CI/CD
- Cloudflare workflows are removed. Use Deno-compatible hosting or run the Deno server directly where deployed.
- The Build workflow still produces the `static/` artifact; deployment is out of scope of this repo.

## Cleanup Policy (when touching nearby code)
- Remove: `wrangler.toml`, `.wrangler/`, any `wrangler` scripts in `package.json`.
- Remove dependencies: `wrangler`, `@cloudflare/workers-types`.
- Delete Cloudflare-specific GitHub workflows and helper scripts.
- Do not introduce new Cloudflare/Wrangler code or config.

## Notes
- Cloudflare-specific code has been removed, including the former `functions/` directory.
