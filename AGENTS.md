Project AGENTS.md — Deno‑Only Policy

Scope: applies to the entire repository.

Intent
- This project uses Deno 2.x exclusively for dev, build, and tooling.
- Do not invoke Node package managers or Node CLIs directly; use Deno’s npm: spec via deno run/task.

Allowed
- Deno runtime and tasks:
  - `deno task dev` — run server + esbuild watch
  - `deno task serve` — run the server only
  - `deno task build` — bundle frontend assets via esbuild (npm:esbuild)
  - `deno task fmt` — Prettier write (alias to `npm:prettier`)
  - `deno task lint:eslint` — ESLint via `npm:eslint`
  - `deno task fmt:prettier` — explicit Prettier task when needed

Disallowed
- Do not run `npm`, `pnpm`, or `yarn` commands for this repo.
- Do not rely on `node`, `npx`, or binaries from `node_modules/.bin`.
- Do not check in or depend on `node_modules` for local workflows; Deno manages npm dependencies internally.
 - Do not use `deno fmt`. Use Prettier tasks to respect repo rules.

Environment & Config
- Local env lives in `.env`; loaded automatically by `std/dotenv`.
- Required vars for builds and API use include `SUPABASE_URL` and `SUPABASE_ANON_KEY`; others (e.g., `GITHUB_TOKEN`, `VOYAGEAI_API_KEY`) as features require.
- Deno permissions are declared in tasks; do not broaden without need.

Build & Bundling
- Use `npm:` imports inside Deno (e.g., `npm:esbuild`) as configured in `build/` scripts.
- Do not call esbuild via Node binaries; always via `deno run`.

Formatting & Linting
- Formatting: Prettier only. Run `deno task fmt` or `deno task fmt:prettier`.
- Linting: ESLint only. Run `deno task lint:eslint`.
- Note: `deno fmt` is not used; the Deno fmt config has been removed from `deno.json`.

Git Hooks
- Pre-commit: `.husky/pre-commit` runs `lint-staged` via `deno run -A npm:lint-staged` to apply Prettier/ESLint on staged files.
- Commit-msg: `.husky/commit-msg` runs Commitlint via Deno (`deno run -A npm:@commitlint/cli --edit "$1"`).

Local Server
- Primary entry: `server.ts` (Deno KV enabled). Default port: 8080.
- Static assets served from `static/`; SPA fallback to `static/index.html`.

Notes for Agents
- Prefer Deno standard library and first‑party APIs.
- If a tool is only available as an npm package, run it through Deno with an `npm:` spec, not via Node.
- Keep scripts and docs aligned with Deno‑only usage.
