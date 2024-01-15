# DevPool Directory UI

```sh
cp .env.example .env
```

Ensure that `SUPABASE_URL` and `SUPABASE_KEY` are set. This is for GitHub user registration on login.

```sh
yarn
yarn start
open http://localhost:8080
```

# Automatic Light Mode

- There is a plugin (`build/plugins/invert-colors.ts`) that inverts the greyscale shades in `style.css` and outputs `inverted-style.css`.
- This plugin specifically seeks greyscale colors. Any colors with saturation are ignored.
- Any deliberate use of color (with saturation) should be added in `special.css` to not be processed.
