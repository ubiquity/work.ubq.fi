import esbuild from "esbuild";
import fs from "fs";
import path from "path";
import manifest from "../../static/manifest.json";

const DIST = `../../static/dist`;

export const pwaManifest: esbuild.Plugin = {
  name: "pwa-manifest",
  setup(build) {
    build.onEnd(() => {
      // Update the icon paths
      manifest.icons.forEach((icon) => {
        const filename = path.basename(icon.src);
        const hashedFilename = fs.readdirSync(path.resolve(__dirname, DIST)).find((file) => file.startsWith(filename.split(".")[0]));

        // Update the icon src in the manifest
        if (hashedFilename) {
          icon.src = `/${hashedFilename}`;
        }
      });

      // Write the updated manifest to the output directory
      fs.writeFileSync(path.resolve(__dirname, `${DIST}/manifest.json`), JSON.stringify(manifest, null, 2));
    });
  },
};
