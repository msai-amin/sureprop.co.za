#!/usr/bin/env bash
# Deploy to Vercel production. Requires one of:
#   - `vercel login` (interactive, once per machine), or
#   - `VERCEL_TOKEN` from https://vercel.com/account/tokens
set -euo pipefail
cd "$(dirname "$0")/.."

if ! vercel whoami >/dev/null 2>&1; then
  if [[ -z "${VERCEL_TOKEN:-}" ]]; then
    echo "Not logged in. Run:  vercel login"
    echo "Or set VERCEL_TOKEN and run this script again."
    exit 1
  fi
fi

exec vercel deploy --prod --yes "$@"
