import * as esbuild from "npm:esbuild";
import { denoPlugins } from "https://deno.land/x/esbuild_deno_loader@0.9.0/mod.ts";
// No longer using esbuild plugins for CSS/manifest; handle CSS inversion post-build.

const entries = ["src/home/home.ts"];

const isProd = (Deno.env.get("NODE_ENV") || "development") === "production";

export const esBuildContext: esbuild.BuildOptions = {
  plugins: [],
  // Use inline sourcemaps in dev to avoid network/map caching issues; linked maps in prod
  sourcemap: isProd ? true : "inline",
  entryPoints: entries,
  bundle: true,
  minify: false,
  platform: "browser",
  format: "esm",
  external: ["https://*", "http://*"],
  loader: {
    ".png": "dataurl",
    ".woff": "dataurl",
    ".woff2": "dataurl",
    ".eot": "dataurl",
    ".ttf": "dataurl",
    ".svg": "dataurl",
    ".json": "dataurl",
  },
  outdir: "static/dist",
  define: createEnvDefines(["SUPABASE_URL", "SUPABASE_ANON_KEY"], {
    SUPABASE_STORAGE_KEY: generateSupabaseStorageKey(),
    GIT_REVISION: await gitRevisionShort(),
    NODE_ENV: Deno.env.get("NODE_ENV") || "development",
  }),
};

await esbuild.build(esBuildContext);
console.log("\tesbuild complete");
await generateInvertedCss("static/style/style.css", "static/style/inverted-style.css");
console.log("\tcss inversion complete");

function createEnvDefines(environmentVariables: string[], generatedAtBuild: Record<string, unknown>): Record<string, string> {
  const defines: Record<string, string> = {};
  for (const name of environmentVariables) {
    const envVar = Deno.env.get(name);
    if (envVar !== undefined) {
      defines[name] = JSON.stringify(envVar);
    } else {
      throw new Error(`Missing environment variable: ${name}`);
    }
  }
  for (const key in generatedAtBuild) {
    if (Object.prototype.hasOwnProperty.call(generatedAtBuild, key)) {
      defines[key] = JSON.stringify(generatedAtBuild[key]);
    }
  }
  return defines;
}

export function generateSupabaseStorageKey(): string | null {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  if (!SUPABASE_URL) {
    console.error("SUPABASE_URL environment variable is not set");
    return null;
  }

  const urlParts = SUPABASE_URL.split(".");
  if (urlParts.length === 0) {
    console.error("Invalid SUPABASE_URL environment variable");
    return null;
  }

  const domain = urlParts[0];
  const lastSlashIndex = domain.lastIndexOf("/");
  if (lastSlashIndex === -1) {
    console.error("Invalid SUPABASE_URL format");
    return null;
  }

  return domain.substring(lastSlashIndex + 1);
}

async function gitRevisionShort(): Promise<string> {
  try {
    const cmd = new Deno.Command("git", { args: ["rev-parse", "--short", "HEAD"] });
    const { code, stdout } = await cmd.output();
    if (code === 0) {
      return new TextDecoder().decode(stdout).trim();
    }
  } catch (_) {
    // ignore
  }
  return "unknown";
}

async function generateInvertedCss(inputPath: string, outputPath: string) {
  const contents = await Deno.readTextFile(inputPath);
  const updatedContents = contents.replace(/prefers-color-scheme: dark/g, "prefers-color-scheme: light");
  const invertedContents = updatedContents.replace(/#([0-9A-Fa-f]{3,6})([0-9A-Fa-f]{2})?\b/g, (match, rgb, alpha) => {
    let color = rgb.startsWith("#") ? rgb.slice(1) : rgb;
    if (color.length === 3) {
      color = color
        .split("")
        .map((char: string) => char + char)
        .join("");
    }
    const r = parseInt(color.slice(0, 2), 16);
    const g = parseInt(color.slice(2, 4), 16);
    const b = parseInt(color.slice(4, 6), 16);
    if (r === g && g === b) {
      const inverted = (255 - r).toString(16).padStart(2, "0");
      return `#${inverted}${inverted}${inverted}${alpha || ""}`;
    }
    return `#${color}${alpha || ""}`;
  });
  await Deno.mkdir(new URL("../", new URL(outputPath, import.meta.url)).pathname, { recursive: true }).catch(() => {});
  await Deno.writeTextFile(outputPath, invertedContents);
}
