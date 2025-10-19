// Stop background dev processes started by scripts/dev_bg.ts
async function killFrom(pidFile: string, label: string) {
  let pidText: string;
  try {
    pidText = await Deno.readTextFile(pidFile);
  } catch (_) {
    console.log(`${label}: no pid file`);
    return;
  }
  const pid = Number(pidText.trim());
  if (!Number.isFinite(pid)) {
    console.log(`${label}: invalid pid`);
    return;
  }
  try {
    Deno.kill(pid, "SIGTERM");
    await new Promise((r) => setTimeout(r, 200));
    console.log(`${label}: signaled ${pid}`);
  } catch (err) {
    console.log(`${label}: failed to signal ${pid}:`, String(err));
  }
  try {
    await Deno.remove(pidFile);
  } catch (_) {}
}

await killFrom("logs/dev-server.pid", "server");
await killFrom("logs/dev-watch.pid", "watch");
