#!/usr/bin/env bash
set -euo pipefail

# Minimal server smoke test for ~15s using Deno server
# - Starts local server on 8080 (or PORT)
# - Probes root and a SPA route
# - Stops within ~15s to avoid hanging

mkdir -p logs

PORT=${PORT:-8080}
# If port is busy, try next
if lsof -i :${PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
  PORT=$((PORT+1))
fi
URL="http://127.0.0.1:${PORT}/"

echo "Starting Deno server on port ${PORT}..."
(
  PORT=${PORT} deno run --allow-net --allow-read --allow-env=PORT scripts/deno-static-server.ts
) > logs/deno_dev.out 2>&1 &
spid=$!

cleanup() {
  if ps -p $spid >/dev/null 2>&1; then
    kill $spid >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Wait up to 5s for server to respond
for i in $(seq 1 25); do
  if curl -sS -o /dev/null -m 0.4 -w '%{http_code}' "${URL}" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done

echo "--- GET / (headers) ---"
curl -sS -D - -o /dev/null --max-time 2 "${URL}" | head -n 20 || true

echo "--- GET /does-not-exist (headers) ---"
curl -sS -D - -o /dev/null --max-time 2 "${URL}does-not-exist" | head -n 20 || true

# Keep alive briefly to ensure stability, then exit
sleep 10

echo "--- SERVER LOG (tail) ---"
tail -n 20 logs/deno_dev.out || true

echo "Done."
