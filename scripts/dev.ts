// Simple dev runner to start server and esbuild watch concurrently.
// Rationale: provides a single entry that (1) runs both processes, (2) auto-picks a free port
// when PORT is unset, and (3) cleans up both children on Ctrl+C/kill so CI/agents don’t hang.
const desiredPort = Deno.env.get("PORT") ?? "0"; // 0 = auto-assign an open port

const serve = new Deno.Command(Deno.execPath(), {
  args: ["run", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"],
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
