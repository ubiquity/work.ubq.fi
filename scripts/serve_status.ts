// Reports whether the server is responding on the configured port.
const portFile = Deno.env.get("SERVER_PORT_FILE") ?? "logs/server.port";
let port = Number(Deno.env.get("PORT")) || 8080;
try {
  const txt = await Deno.readTextFile(portFile);
  const p = Number(txt.trim());
  if (Number.isFinite(p)) port = p;
} catch (_) {}

try {
  const res = await fetch(`http://127.0.0.1:${port}/`, { method: "GET" });
  if (res.ok || res.status === 404) {
    console.log(`Server is UP on http://localhost:${port}`);
    Deno.exit(0);
  }
  console.log(`Server responded with status ${res.status} on http://localhost:${port}`);
  Deno.exit(0);
} catch (err) {
  console.log(`Server is DOWN on http://localhost:${port}:`, String(err));
  Deno.exit(1);
}
