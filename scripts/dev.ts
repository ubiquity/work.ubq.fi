// Simple dev runner to start server and esbuild watch concurrently
// Picks an available port automatically unless PORT is provided by the user.
const desiredPort = Deno.env.get("PORT") ?? "0"; // 0 = auto-assign an open port

const serve = new Deno.Command(Deno.execPath(), {
  args: ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
  stdout: "inherit",
  stderr: "inherit",
  env: { PORT: desiredPort },
});

const watch = new Deno.Command(Deno.execPath(), {
  args: ["run", "-A", "build/esbuild-watch.ts"],
  stdout: "inherit",
  stderr: "inherit",
});

const serverProc = serve.spawn();
const watchProc = watch.spawn();

// Ensure child processes are cleaned up on Ctrl+C or kill
function gracefulShutdown(_signal: Deno.Signal) {
  try {
    serverProc.kill("SIGTERM");
  } catch (_) {}
  try {
    watchProc.kill("SIGTERM");
  } catch (_) {}
  // Give children a brief moment to exit
  setTimeout(() => Deno.exit(0), 50);
}

Deno.addSignalListener("SIGINT", () => gracefulShutdown("SIGINT"));
Deno.addSignalListener("SIGTERM", () => gracefulShutdown("SIGTERM"));

const serverStatus = serverProc.status;
const watchStatus = watchProc.status;

const result = await Promise.race([serverStatus.then((s) => ({ who: "server", s })), watchStatus.then((s) => ({ who: "watch", s }))]);

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
