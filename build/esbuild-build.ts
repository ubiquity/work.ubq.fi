import * as dotenv from "dotenv";
import esbuild from "esbuild";
import { invertColors } from "./plugins/invert-colors";
const typescriptEntries = [
  "src/home/home.ts",
  // "src/login/login.ts",
  // "src/authenticated/authenticated.ts"
];
const cssEntries = ["static/style/style.css"];
const entries = [...typescriptEntries, ...cssEntries];

export const esBuildContext: esbuild.BuildOptions = {
  define: createEnvDefines(["GITHUB_TOKEN", "SUPABASE_URL", "SUPABASE_KEY"]),
  plugins: [invertColors],
  sourcemap: true,
  entryPoints: entries,
  bundle: true,
  minify: false,
  loader: {
    ".png": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".eot": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
  },
  outdir: "static/dist",
};

esbuild
  .build(esBuildContext)
  .then(() => {
    console.log("\tesbuild complete");
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

function createEnvDefines(variableNames: string[]): Record<string, string> {
  const defines: Record<string, string> = {};
  dotenv.config();
  for (const name of variableNames) {
    const envVar = process.env[name];
    if (envVar !== undefined) {
      defines[`process.env.${name}`] = JSON.stringify(envVar);
    }
  }
  return defines;
}
