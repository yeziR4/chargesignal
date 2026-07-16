#!/bin/sh
set -eu

: "${VANA_APP_PRIVATE_KEY:?Set VANA_APP_PRIVATE_KEY as a Hugging Face Space secret}"
: "${VANA_APP_URL:?Set VANA_APP_URL as a Hugging Face Space variable}"

exec node node_modules/wrangler/bin/wrangler.js dev \
  --config dist/server/wrangler.json \
  --ip 0.0.0.0 \
  --port 7860 \
  --show-interactive-dev-session=false \
  --var "VANA_APP_PRIVATE_KEY:${VANA_APP_PRIVATE_KEY}" \
  --var "VANA_APP_URL:${VANA_APP_URL}" \
  --var "VANA_NETWORK:${VANA_NETWORK:-moksha}"

