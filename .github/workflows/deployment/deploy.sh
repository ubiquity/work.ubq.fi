#!/bin/bash
set -euo pipefail

MODE=$1
TOKEN=$2
PROD_PROJECT=$3
PREVIEW_PROJECT=$4

if [ "$MODE" = "production" ]; then
  PROJECT=$PROD_PROJECT
else
  PROJECT=$PREVIEW_PROJECT
fi

flags=(
  "--project=$PROJECT"
  "--token=$TOKEN"
  "--entrypoint=server.ts"
  "--exclude=src"
  "--env-var=SUPABASE_URL=$SUPABASE_URL"
)

## Resolve server-side key from SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY
if [ -z "${SUPABASE_KEY:-}" ] && [ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]; then
  SUPABASE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
fi
if [ -n "${SUPABASE_KEY:-}" ]; then
  flags+=("--env-var=SUPABASE_KEY=$SUPABASE_KEY")
fi

if [ -n "${SUPABASE_ANON_KEY:-}" ]; then
  flags+=("--env-var=SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY")
fi

if [ -n "${VOYAGEAI_API_KEY:-}" ]; then
  flags+=("--env-var=VOYAGEAI_API_KEY=$VOYAGEAI_API_KEY")
fi

if [ "$MODE" = "production" ]; then
  flags+=("--prod")
fi

deployctl deploy "${flags[@]}"
