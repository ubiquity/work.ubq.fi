// Watcher that bundles TS via `deno bundle --watch` and runs esbuild watch for CSS/assets

try {
  await Deno.mkdir(new URL("../static/dist/", import.meta.url), { recursive: true });
} catch (_) {
  // ignore
}

const tsBundle = new Deno.Command(Deno.execPath(), {
  args: ["bundle", "--unstable-sloppy-imports", "--sourcemap=inline", "--watch", "src/home/home.ts", "static/dist/home.js"],
  stdout: "inherit",
  stderr: "inherit",
});

const cssWatch = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "build/esbuild-watch.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const tsProc = tsBundle.spawn();
const cssProc = cssWatch.spawn();

const result = await Promise.race([tsProc.status.then((s) => ({ who: "bundle", s })), cssProc.status.then((s) => ({ who: "esbuild", s }))]);

try {
  if (result.who === "bundle") cssProc.kill("SIGINT");
  else tsProc.kill("SIGINT");
} catch (_) {
  // ignore
}

console.log(`\n${result.who} watcher exited with code ${result.s.code}`);
Deno.exit(result.s.code ?? 1);
