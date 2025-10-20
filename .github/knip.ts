// Minimal Knip config for a Deno-only repo using npm: via Deno
// See: https://knip.dev/reference/configuration
import type { KnipConfig } from "npm:knip";

const config: KnipConfig = {
  // Restrict issue types so this works in a Deno-first repo without package.json
  include: ["files", "exports"],
  entry: ["server.ts", "build/esbuild-build.ts", "build/esbuild-watch.ts", "scripts/dev.ts", "src/home/home.ts"],
  project: ["server.ts", "src/**/*.ts", "functions/**/*.ts", "build/**/*.ts", "scripts/**/*.ts"],
  ignore: [".github/**", "static/dist/**", "node_modules/**", "scripts/**"],
};

export default config;
