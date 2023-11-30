import esbuild from "esbuild";
const typescriptEntries = [
  "src/home/home.ts",
  "src/login/login.ts",
  // "src/authenticated/authenticated.ts"
];
// const cssEntries = ["static/style.css"];
import * as dotenv from "dotenv";
dotenv.config();
const entries = [
  ...typescriptEntries,
  //  ...cssEntries
];

export const esBuildContext: esbuild.BuildOptions = {
  define: {
    "process.env.GITHUB_TOKEN": JSON.stringify(process.env.GITHUB_TOKEN),
    "process.env.SUPABASE_URL": JSON.stringify(process.env.SUPABASE_URL),
    "process.env.SUPABASE_KEY": JSON.stringify(process.env.SUPABASE_KEY),
  },
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
