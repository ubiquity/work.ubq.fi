// Wrapper to run Knip via Deno's npm: spec in a Deno-first repo.
// Auto-scopes behavior:
// - If package.json has dependencies/devDependencies/workspaces, include dependency checks ("proper" knip).
// - Otherwise, limit to files/exports to avoid false positives in Deno-only usage.

async function hasNodeDeps(): Promise<boolean> {
  try {
    const txt = await Deno.readTextFile("package.json");
    const pkg = JSON.parse(txt);
    const hasDeps = pkg?.dependencies && Object.keys(pkg.dependencies).length > 0;
    const hasDevDeps = pkg?.devDependencies && Object.keys(pkg.devDependencies).length > 0;
    const hasWs = !!pkg?.workspaces;
    return Boolean(hasDeps || hasDevDeps || hasWs);
  } catch {
    return false;
  }
}

// Filter out a standalone "--" (used by `deno task` to pass args)
const forwardedArgs = Deno.args.filter((a) => a !== "--");

// If the caller already specified include/deps flags, don't add defaults
const hasInclude = forwardedArgs.some((a) => a === "--include" || a.startsWith("--include="));
const hasDepsShortcut = forwardedArgs.includes("--dependencies");
const includeArgs = hasInclude || hasDepsShortcut ? [] : (await hasNodeDeps()) ? ["--dependencies"] : ["--include", "files,exports"];

const args = ["run", "-A", "npm:knip@3.13.2", "--config", ".github/knip.ts", ...includeArgs, ...forwardedArgs];

const cmd = new Deno.Command(Deno.execPath(), {
  args,
  stdout: "inherit",
  stderr: "inherit",
});

const { code } = await cmd.output();
Deno.exit(code);
