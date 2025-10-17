import esbuild from "npm:esbuild";
import { dirname, join } from "https://deno.land/std@0.224.0/path/mod.ts";

export const invertColors: esbuild.Plugin = {
  name: "invert-colors",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const contents = await Deno.readTextFile(args.path);

      const updatedContents = contents.replace(/prefers-color-scheme: dark/g, "prefers-color-scheme: light");

      // Invert greyscale colors and accommodate alpha channels in the CSS content
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

        // Check if the color is greyscale (R, G, and B components are equal)
        if (r === g && g === b) {
          // Invert RGB values
          const invertedColorValue = (255 - r).toString(16).padStart(2, "0");
          // Return the inverted greyscale color with alpha channel if present
          return `#${invertedColorValue}${invertedColorValue}${invertedColorValue}${alpha || ""}`;
        }

        // If the color is not greyscale, return it as is, including the alpha channel if present
        return `#${color}${alpha || ""}`;
      });

      // Define the output path for the new CSS file
      const outputPath = join(Deno.cwd(), "static", "style", "inverted-style.css");
      const outputDir = dirname(outputPath);
      await Deno.mkdir(outputDir, { recursive: true });
      // Write the new contents to the output file
      await Deno.writeTextFile(outputPath, invertedContents);

      // Return an empty result to esbuild since we're writing the file ourselves
      return { contents: "", loader: "css" };
    });
  },
};
