// Simple dev runner to start server and esbuild watch concurrently
const serve = new Deno.Command(Deno.execPath(), {
  args: ["run", "--allow-net", "--allow-read", "--allow-env", "server.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const watch = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "build/esbuild-watch.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const serverProc = serve.spawn();
const watchProc = watch.spawn();

const serverStatus = serverProc.status;
const watchStatus = watchProc.status;

const result = await Promise.race([
  serverStatus.then((s) => ({ who: "server", s })),
  watchStatus.then((s) => ({ who: "watch", s })),
]);

try {
  // Try gracefully terminate the other process
  if (result.who === "server") {
    watchProc.kill("SIGINT");
  } else {
    serverProc.kill("SIGINT");
  }
} catch (_) {
  // ignore
}

console.log(`\n${result.who} exited with code ${result.s.code}`);
// Exit with non-zero if either failed
Deno.exit(result.s.code ?? 1);

