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

### Automatic Light Mode

- There is a plugin (`build/plugins/invert-colors.ts`) that inverts the greyscale shades in `style.css` and outputs `inverted-style.css`.
- This plugin specifically seeks greyscale colors. Any colors with saturation are ignored.
- Any deliberate use of color (with saturation) should be added in `special.css` to not be processed.

## Contributing

- Deno-only policy: use Deno tasks and `npm:` tools through Deno. Do not run `npm`, `pnpm`, `yarn`, `node`, or `npx` in this repo.
- Run server: `deno task dev` (watch) or `deno task serve` (server only).
- Build assets: `deno task build` (esbuild via `npm:esbuild`).
- Formatting: `deno task format` (Prettier). Check mode: `deno task format:check`.
- Linting: `deno task lint` (ESLint). This repo does not use `deno fmt`.
- Spell check: `deno task cspell`.
- Static analysis (Knip): `deno task knip` — in a Deno‑only repo without `package.json`, this task is skipped gracefully.
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
