#!/bin/bash

# Check if required environment variables are set
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ] || [ -z "$GITHUB_REPOSITORY" ] || \
   [ -z "$VOYAGEAI_API_KEY" ] || [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_ANON_KEY" ]; then
    echo "Error: Required environment variables are not set"
    exit 1
fi

# Extract just the repository name from org/repo format
REPOSITORY_NAME=$(echo "$GITHUB_REPOSITORY" | cut -d'/' -f2)
# Replace dots with hyphens
REPOSITORY_NAME=${REPOSITORY_NAME//./-}

# Echo the repository name
echo "Repository name: $REPOSITORY_NAME"

# Make the API call to Cloudflare
curl -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${REPOSITORY_NAME}/deployment_configs" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  --data '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "VOYAGEAI_API_KEY": {
            "value": "'"${VOYAGEAI_API_KEY}"'",
            "type": "secret_text"
          },
          "SUPABASE_URL": {
            "value": "'"${SUPABASE_URL}"'",
            "type": "secret_text"
          },
          "SUPABASE_ANON_KEY": {
            "value": "'"${SUPABASE_ANON_KEY}"'",
            "type": "secret_text"
          }
        }
      }
    }
  }'