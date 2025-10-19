# DevPool Directory UI

## Development Setup

```sh
cp .env.example .env
# Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set

# Build once
deno task build

# Or watch in one terminal
deno task watch

# Recommended: one-shot dev entry (watch + server)
deno task dev
# then open http://localhost:8080

# Or, serve manually in another terminal
# Note: add --allow-run to enable auto-kill of occupied port during dev
deno run --allow-net --allow-read --allow-env=PORT --allow-run scripts/deno-static-server.ts
```

## Server & Deployment

This project serves the built UI via a pure Deno HTTP server. Cloudflare Wrangler/Workers/Pages are no longer used.

For deployment, run the Deno server wherever you host (container, VM, etc.). The CI "Build" workflow still produces the `static/` artifact.

### Automatic Light Mode

- There is a plugin (`build/plugins/invert-colors.ts`) that inverts the greyscale shades in `style.css` and outputs `inverted-style.css`.
- This plugin specifically seeks greyscale colors. Any colors with saturation are ignored.
- Any deliberate use of color (with saturation) should be added in `special.css` to not be processed.

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
