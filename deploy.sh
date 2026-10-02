#!/usr/bin/env bash
# Deploys the site to Azure Static Web Apps.
#
# One-time setup (see README "Deployment"):
#   1. Create a Static Web App (Free plan, deployment source "Other") in the Azure portal.
#   2. Copy its deployment token: Overview -> "Manage deployment token".
#   3. Save it locally so it is never committed:   echo 'TOKEN' > ~/.gasis-swa-token
#
# Then every deploy is just:   ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"

TOKEN_FILE="${SWA_TOKEN_FILE:-$HOME/.gasis-swa-token}"
if [[ -z "${SWA_CLI_DEPLOYMENT_TOKEN:-}" ]]; then
  if [[ ! -f "$TOKEN_FILE" ]]; then
    echo "No deployment token. Put it in $TOKEN_FILE or export SWA_CLI_DEPLOYMENT_TOKEN." >&2
    exit 1
  fi
  SWA_CLI_DEPLOYMENT_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  export SWA_CLI_DEPLOYMENT_TOKEN
fi

echo "Rebuilding pages..."
python3 build.py

echo "Deploying to Azure Static Web Apps (production)..."
npx --yes @azure/static-web-apps-cli@2 deploy --config-name gasis --env production
