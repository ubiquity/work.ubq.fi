import esbuild from "esbuild";
import fs from "fs";
import path from "path";

export const invertColors: esbuild.Plugin = {
  name: "invert-colors",
  setup(build) {
    build.onLoad({ filter: /\.css$/ }, async (args) => {
      const contents = await fs.promises.readFile(args.path, "utf8");

      // Invert colors in the CSS content
      const invertedContents = contents.replace(/#([0-9A-Fa-f]{3,8})/g, (match) => {
        // Convert hex color to RGB, supporting three and six character hex codes
        let color = match.startsWith("#") ? match.slice(1) : match;
        if (color.length === 3) {
          color = color.split('').map(char => char + char).join('');
        }
        const r = parseInt(color.slice(0, 2), 16);
        const g = parseInt(color.slice(2, 4), 16);
        const b = parseInt(color.slice(4, 6), 16);
        const a = color.length === 8 ? parseInt(color.slice(6, 8), 16) / 255 : 1;

        // Invert RGB values
        const invertedR = (255 - r).toString(16).padStart(2, "0");
        const invertedG = (255 - g).toString(16).padStart(2, "0");
        const invertedB = (255 - b).toString(16).padStart(2, "0");
        const invertedA =
          a !== 1
            ? Math.round((1 - a) * 255)
                .toString(16)
                .padStart(2, "0")
            : "";

        // Return the inverted color
        return `#${invertedR}${invertedG}${invertedB}${invertedA}`;
      });

      // Define the output path for the new CSS file
      const outputPath = path.resolve("static/style", "inverted-style.css");
      const outputDir = path.dirname(outputPath);
      await fs.promises.mkdir(outputDir, { recursive: true });
      // Write the new contents to the output file
      await fs.promises.writeFile(outputPath, invertedContents, "utf8");

      // Return an empty result to esbuild since we're writing the file ourselves
      return { contents: "", loader: "css" };
    });
  },
};
