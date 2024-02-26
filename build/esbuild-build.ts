import * as dotenv from "dotenv";
import esbuild from "esbuild";
import { invertColors } from "./plugins/invert-colors";
import { pwaManifest } from "./plugins/pwa-manifest";
const typescriptEntries = ["src/home/home.ts", "src/progressive-web-app.ts"];
const cssEntries = ["static/style/style.css"];
const entries = [...typescriptEntries, ...cssEntries, "static/manifest.json", "static/favicon.svg", "static/icon-512x512.png"];

export const esBuildContext: esbuild.BuildOptions = {
  define: createEnvDefines(["SUPABASE_URL", "SUPABASE_ANON_KEY"]),
  plugins: [invertColors, pwaManifest],
  sourcemap: true,
  entryPoints: entries,
  bundle: true,
  minify: false,
  loader: {
    ".png": "file",
    ".woff": "file",
    ".woff2": "file",
    ".eot": "file",
    ".ttf": "file",
    ".svg": "file",
    ".json": "file",
  },
  outdir: "static/dist",
};

esbuild
  .build(esBuildContext)
  .then(() => console.log("\tesbuild complete"))
  .catch(console.error);

function createEnvDefines(variableNames: string[]): Record<string, string> {
  const defines: Record<string, string> = {};
  dotenv.config();
  for (const name of variableNames) {
    const envVar = process.env[name];
    if (envVar !== undefined) {
      defines[`process.env.${name}`] = JSON.stringify(envVar);
    } else {
      throw new Error(`Missing environment variable: ${name}`);
    }
  }
  return defines;
}
