// Start server + esbuild watcher detached and return quickly.
// Writes PIDs to logs/dev-server.pid and logs/dev-watch.pid.

await Deno.mkdir("logs", { recursive: true });

function spawnDetached(args: string[], pidFile: string) {
  const cmd = new Deno.Command(Deno.execPath(), {
    args,
    detached: true,
    stdin: "null",
    stdout: "null",
    stderr: "null",
  });
  const child = cmd.spawn();
  child.unref();
  return Deno.writeTextFile(pidFile, String(child.pid));
}

const serverArgs = ["run", "--unstable-kv", "--allow-net", "--allow-read", "--allow-env", "--allow-write", "server.ts"];

const watchArgs = ["run", "-A", "build/esbuild-watch.ts"];

await spawnDetached(serverArgs, "logs/dev-server.pid");
await spawnDetached(watchArgs, "logs/dev-watch.pid");

console.log("Dev processes started in background (server + watch). Exiting.");
