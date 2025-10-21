# DevPool Directory UI

## Development Setup

```sh
cp .env.example .env
```

Ensure that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set. This is for GitHub user registration on login.

With Deno installed:

```sh
deno task build   # one-time build
deno task dev     # run server + watch
# open http://localhost:8080 (override with PORT=8899 deno task dev)
```

## Setup Scraper Function

The scraper API (`/issue-scraper`) now runs on a local Deno server.

- Local development: set environment variables in `.env` (e.g. `SUPABASE_URL`, `SUPABASE_KEY`/`SUPABASE_SERVICE_ROLE_KEY`, `VOYAGEAI_API_KEY`). The Deno server loads `.env` automatically via std/dotenv.
- Deployment: configure the same variables in your runtime environment (e.g., system env vars). No Cloudflare configuration is required.

## Login Config (Supabase)

- Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY` for the browser bundle.
- Server-side: provide either `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` (the workflow and server accept both).
- Local: set values in `.env` (see `.env.example:1`).
- GitHub Secrets: set `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and either `SUPABASE_KEY` or `SUPABASE_SERVICE_ROLE_KEY` so CI builds and deploys correctly (`.github/workflows/deploy-deno.yml:1`).
- Deno Deploy: the deploy script forwards whichever server-side key is present (`.github/workflows/deployment/deploy.sh:1`).
- Ensure `SUPABASE_URL` points to a valid project ref (e.g., `https://wfzpewmlyiozupulbuur.supabase.co`). Update secrets if the project changes.

### Automatic Light Mode

- There is a plugin (`build/plugins/invert-colors.ts`) that inverts the greyscale shades in `style.css` and outputs `inverted-style.css`.
- This plugin specifically seeks greyscale colors. Any colors with saturation are ignored.
- Any deliberate use of color (with saturation) should be added in `special.css` to not be processed.

## Contributing

- Deno-only policy: use Deno tasks and `npm:` tools through Deno. Do not run `npm`, `pnpm`, `yarn`, `node`, or `npx` in this repo.
- Run server: `deno task dev` (watch) or `deno task serve` (server only).
- Quick smoke (15s, ephemeral port): `deno task serve:15s`
- Build assets: `deno task build` (esbuild via `npm:esbuild`).
- Formatting: `deno task format` (Prettier). Check mode: `deno task format:check`.
- Linting: `deno task lint` (ESLint). This repo does not use `deno fmt`.
- Spell check: `deno task cspell`.
- Static analysis (Knip): `deno task knip` — runs via Deno’s `npm:` and checks unused files/exports (not dependencies). No Node required.
- Git hooks: pre-commit runs lint-staged (Prettier/ESLint) via Deno; commit messages are checked with Commitlint.

## Features for End Users

- Login with GitHub to view issues locally
- Keyboard navigation (up/down arrows and escape/enter key)
- Sorting

### Screenshots

#### Desktop

![screenshot 4](https://github.com/ubiquity/devpool-directory-ui/assets/4975670/77dc4263-3837-47de-9924-e82fb571e8cc)
![screenshot 0](https://github.com/ubiquity/devpool-directory-ui/assets/4975670/7cf35a52-ef1d-4b8a-a29e-06e2adab2862)

#### Mobile

![screenshot 2](https://github.com/ubiquity/devpool-directory-ui/assets/4975670/b7861ce7-1f1f-49a9-b8e2-ebb20724ee67)

### Running via Codex (non-interactive, 15s)

To verify the server starts and does not hang under an agent, run a Codex sub-instance and execute the 15s task:

```
codex exec --yolo -C "$PWD" "Run the convenience task: deno task serve:15s. Expect an ephemeral port and a 15s runtime. Return output and exit."
```

This starts the server on an ephemeral port, streams the logs (e.g., "Deno server listening on http://0.0.0.0:<port>"), and exits after ~15 seconds without hanging.
