# DevPool Directory UI

## Development Setup

```sh
cp .env.example .env
```

Ensure that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set. This is for GitHub user registration on login.

```sh
yarn
yarn start
open http://localhost:8080
```

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
