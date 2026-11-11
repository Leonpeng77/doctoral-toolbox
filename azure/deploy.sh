#!/usr/bin/env bash
# One-command deployment of the dev/research prototype.
#   ./azure/deploy.sh
#
# Deliberately dependency-light: uses only `az`, `zip` and `curl`.
# No npm install, no node_modules, no Bicep CLI download. The Functions
# app uses the v3 programming model (function.json), so the deployed
# package contains nothing but our own JavaScript.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AZURE_DIR="$ROOT/azure"
APP_DIR="$AZURE_DIR/function-app"
RG="${RG:-rg-doctoral-toolbox-dev}"
LOCATION="${LOCATION:-eastus}"
APP_NAME="${APP_NAME:-doctoral-toolbox}"
ALLOWED_ORIGIN="${ALLOWED_ORIGIN:-https://doctoral-toolbox.app.workbuddy.host}"

echo "== Doctoral Toolbox API: dev deployment =="
echo "   Development, testing and demonstration only."
echo "   The production website is NOT hosted here (see azure/README.md)."
echo

if ! command -v az >/dev/null 2>&1; then
  VENV="${AZURE_CLI_VENV:-$HOME/.azure-cli-venv}"
  if [ ! -x "$VENV/bin/az" ]; then
    echo "== 0/6 Azure CLI not found; bootstrapping into $VENV =="
    echo "   One-time install, a few minutes. Progress shown below."
    python3 -m venv "$VENV"
    "$VENV/bin/python" -m pip install --upgrade pip
    "$VENV/bin/python" -m pip install --timeout 60 --retries 10 \
      --index-url https://mirrors.aliyun.com/pypi/simple/ azure-cli
  fi
  export PATH="$VENV/bin:$PATH"
fi
# Suppress the harmless LibreSSL / urllib3 notice from older macOS Python.
export PYTHONWARNINGS="ignore"

command -v zip >/dev/null 2>&1 || { echo "ERROR: zip not found."; exit 1; }
command -v curl >/dev/null 2>&1 || { echo "ERROR: curl not found."; exit 1; }

if ! az account show >/dev/null 2>&1; then
  echo "== Azure sign-in required (opens a browser) =="
  az login --output none
fi

SUBSCRIPTION="$(az account show --query name -o tsv)"
SUB_ID="$(az account show --query id -o tsv)"
SUFFIX="$(printf '%s' "$SUB_ID" | tr -d '-' | cut -c1-6)"
BASE="$(printf '%s' "$APP_NAME" | tr -cd 'a-z0-9' | cut -c1-12)"
STORAGE="st${BASE}${SUFFIX}"
FUNC="func-${APP_NAME}-${SUFFIX}"

# Ask the CLI which Node versions this subscription still supports.
# Hard-coding 20 broke once it reached end-of-life in April 2026.
NODE_VERSION="${NODE_VERSION:-}"
if [ -z "$NODE_VERSION" ]; then
  NODE_VERSION="$(az functionapp list-runtimes --os-type linux \
    --query "[?runtime=='node'].version | [0]" -o tsv 2>/dev/null || true)"
fi
[ -z "$NODE_VERSION" ] && NODE_VERSION=26

echo "   Subscription : $SUBSCRIPTION"
echo "   Resource group: $RG"
echo "   Region        : $LOCATION"
echo "   Function App  : $FUNC"
echo "   Node runtime  : $NODE_VERSION (queried from Azure, not hard-coded)"
echo

echo "== 1/6 Creating resource group =="
az group create --name "$RG" --location "$LOCATION" --output none

echo "== 2/6 Registering resource providers (first-time subscription) =="
for NS in Microsoft.Storage Microsoft.Web Microsoft.Insights; do
  STATE="$(az provider show -n "$NS" --query registrationState -o tsv 2>/dev/null || echo NotRegistered)"
  if [ "$STATE" = "Registered" ]; then
    echo "   $NS already registered"
  else
    echo "   Registering $NS (can take a few minutes)..."
    az provider register -n "$NS" --wait --output none \
      || echo "   $NS registration still in progress, continuing"
  fi
done

echo "== 3/6 Creating storage account =="
az storage account create \
  --name "$STORAGE" --resource-group "$RG" --location "$LOCATION" \
  --sku Standard_LRS --kind StorageV2 \
  --https-only true --min-tls-version TLS1_2 \
  --allow-blob-public-access false --output none

echo "== 4/6 Creating Linux Consumption function app =="
if az functionapp show --resource-group "$RG" --name "$FUNC" >/dev/null 2>&1; then
  echo "   Function app already exists, reusing it."
else
  az functionapp create \
    --resource-group "$RG" --name "$FUNC" \
    --storage-account "$STORAGE" \
    --consumption-plan-location "$LOCATION" \
    --os-type Linux --runtime node --runtime-version "$NODE_VERSION" \
    --functions-version 4 --output none
fi

echo "== 5/6 Configuring, packaging and publishing =="
az functionapp config appsettings set \
  --resource-group "$RG" --name "$FUNC" \
  --settings FUNCTIONS_WORKER_RUNTIME=node \
            SCM_DO_BUILD_DURING_DEPLOYMENT=false \
            MAX_ENTRIES=200 --output none
# Do NOT pre-set WEBSITE_RUN_FROM_PACKAGE=1 here: on Linux Consumption,
# config-zip manages that setting itself (it writes a blob SAS URL).
# Pre-setting "1" collides with it and zip deploy returns Bad Request.

az functionapp cors add \
  --resource-group "$RG" --name "$FUNC" \
  --allowed-origins "$ALLOWED_ORIGIN" http://localhost:8080 \
  --output none || echo "   (CORS already configured, continuing)"

mkdir -p "$APP_DIR/shared/vendor"
cp "$ROOT/site/assets/js/apa7.js" "$APP_DIR/shared/vendor/apa7.js"
cp "$ROOT/site/assets/js/reference-check.js" "$APP_DIR/shared/vendor/reference-check.js"
cp "$ROOT/site/assets/js/reference-parser.js" "$APP_DIR/shared/vendor/reference-parser.js"

ZIP="$AZURE_DIR/function-app.zip"
rm -f "$ZIP"
(cd "$APP_DIR" && zip -qr "$ZIP" host.json package.json parse health shared)
echo "   Package: $(du -h "$ZIP" | awk '{print $1}') (our code only, no node_modules)"

if ! az functionapp deployment source config-zip \
  --resource-group "$RG" --name "$FUNC" --src "$ZIP" --output none; then
  echo "   config-zip returned an error; Azure may still have applied the package."
  echo "   Verifying before deciding it failed..."
fi

# Force the host to re-mount the package; otherwise Linux Consumption can
# answer 503 for a few minutes after the very first deployment.
az functionapp restart --resource-group "$RG" --name "$FUNC" --output none || true

echo "== 6/6 Verifying =="
HOST="$(az functionapp show --resource-group "$RG" --name "$FUNC" \
  --query defaultHostName -o tsv)"
echo
echo "== Deployed =="
echo "   Health : https://$HOST/api/health"
echo "   Parse  : https://$HOST/api/parse"
echo
echo "   Cold start can take a moment; checking once:"
curl -sS --max-time 30 "https://$HOST/api/health" \
  || echo "   No answer yet - open the Health URL above in a browser in a moment."
echo
echo
echo "Local, account-free equivalent:  node azure/local-server.js"
echo "Handler assertions:             node azure/tests/run.js"
echo "Tear down when finished:        az group delete --name $RG --yes --no-wait"
