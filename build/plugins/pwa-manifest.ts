import esbuild from "npm:esbuild";
import { join } from "https://deno.land/std@0.224.0/path/mod.ts";
import manifest from "../../static/manifest.json" with { type: "json" };

const DIST_DIR = join(Deno.cwd(), "static", "dist");

export const pwaManifest: esbuild.Plugin = {
  name: "pwa-manifest",
  setup(build) {
    build.onEnd(async () => {
      try {
        const files: string[] = [];
        for await (const entry of Deno.readDir(DIST_DIR)) {
          if (entry.isFile) files.push(entry.name);
        }

        for (const icon of manifest.icons) {
          const base = icon.src.split("/").pop() || icon.src;
          const prefix = base.split(".")[0];
          const match = files.find((f) => f.startsWith(prefix));
          if (match) icon.src = `/${match}`;
        }

        await Deno.writeTextFile(join(DIST_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
      } catch (err) {
        console.warn("pwa-manifest plugin: skipped updating manifest:", err?.message ?? err);
      }
    });
  },
};
