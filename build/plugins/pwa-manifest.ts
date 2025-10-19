import type { Plugin } from "npm:esbuild";
import * as path from "jsr:@std/path";

export const pwaManifest: Plugin = {
  name: "pwa-manifest",
  setup(build) {
    build.onEnd(async () => {
      const distDir = path.join(Deno.cwd(), "static", "dist");
      const manifestPath = path.join(Deno.cwd(), "static", "manifest.json");

      let manifest: any;
      try {
        const raw = await Deno.readTextFile(manifestPath);
        manifest = JSON.parse(raw);
      } catch (err) {
        console.error("pwa-manifest: failed to read manifest.json:", err);
        return;
      }

      const files: string[] = [];
      try {
        for await (const entry of Deno.readDir(distDir)) {
          if (entry.isFile) files.push(entry.name);
        }
      } catch (err) {
        console.error("pwa-manifest: failed to read dist directory:", err);
        return;
      }

      for (const icon of manifest.icons ?? []) {
        const filename = path.basename(icon.src);
        const base = filename.split(".")[0];
        const hashed = files.find((f) => f.startsWith(base));
        if (hashed) {
          icon.src = `/${hashed}`;
        }
      }

      try {
        await Deno.writeTextFile(path.join(distDir, "manifest.json"), JSON.stringify(manifest, null, 2));
      } catch (err) {
        console.error("pwa-manifest: failed to write manifest.json:", err);
      }
    });
  },
};
