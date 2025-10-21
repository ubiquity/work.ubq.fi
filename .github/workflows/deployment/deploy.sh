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

deployctl deploy --project="$PROJECT" --token="$TOKEN" --prod --entrypoint=server.ts \
  --env-var=SUPABASE_URL="$SUPABASE_URL" \
  --env-var=SUPABASE_KEY="$SUPABASE_KEY" \
  --env-var=VOYAGEAI_API_KEY="$VOYAGEAI_API_KEY" \
  .
