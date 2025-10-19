// Checks repository files for kebab-case filenames.
// Excludes dotfiles and selected config paths like .github/**, node_modules/**.

const root = new URL("../", import.meta.url);

// Directories to skip (prefix match relative to repo root)
const skipDirs = new Set<string>([
  ".git",
  ".github",
  "node_modules",
  ".husky",
  "static/dist",
  "logs",
]);

// Specific files to ignore (relative paths)
const ignoreFiles = new Set<string>([
  "README.md",
  "AGENTS.md",
]);

const kebabRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function relativePath(path: string): string {
  // path from repo root without leading ./
  return path.replace(new URL("./", root).pathname, "").replace(/^\/*/, "");
}

function isSkippedDir(relPath: string): boolean {
  for (const dir of skipDirs) {
    if (relPath === dir || relPath.startsWith(dir + "/")) return true;
  }
  return false;
}

function isDotfile(name: string): boolean {
  return name.startsWith(".");
}

function validBaseAndExt(name: string): boolean {
  const firstDot = name.indexOf(".");
  const base = firstDot === -1 ? name : name.slice(0, firstDot);
  const ext = firstDot === -1 ? "" : name.slice(firstDot + 1);
  if (!kebabRe.test(base)) return false;
  // If there is an extension chain, ensure it's lowercase letters/digits and dots
  if (ext && !/^[a-z0-9.]+$/.test(ext)) return false;
  return true;
}

const violations: string[] = [];

// Walk recursively
async function walk(dir: string) {
  const base = dir ? dir + "/" : ".";
  for await (const entry of Deno.readDir(new URL(base, root))) {
    const rel = (dir ? dir + "/" : "") + entry.name;
    if (isSkippedDir(rel)) continue;
    if (entry.isDirectory) {
      await walk(rel);
      continue;
    }
    // Skip dotfiles
    if (isDotfile(entry.name)) continue;
    if (ignoreFiles.has(rel)) continue;
    if (!validBaseAndExt(entry.name)) {
      violations.push(rel);
    }
  }
}

await walk("");

if (violations.length) {
  console.error("Non–kebab-case filenames found (excluding dotfiles and .github):");
  for (const v of violations.sort()) console.error(" -", v);
  Deno.exit(1);
} else {
  console.log("All filenames pass kebab-case check.");
}
