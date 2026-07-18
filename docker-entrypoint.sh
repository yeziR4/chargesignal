#!/bin/sh
set -eu

exec node node_modules/wrangler/bin/wrangler.js dev \
  --config dist/server/wrangler.json \
  --ip 0.0.0.0 \
  --port "${PORT:-7860}" \
  --show-interactive-dev-session=false \
  --var "VANA_APP_PRIVATE_KEY:${VANA_APP_PRIVATE_KEY:-}" \
  --var "VANA_APP_URL:${VANA_APP_URL:-http://localhost:${PORT:-7860}}" \
  --var "VANA_NETWORK:${VANA_NETWORK:-moksha}"
