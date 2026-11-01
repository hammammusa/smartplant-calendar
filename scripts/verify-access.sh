#!/usr/bin/env bash
# Verifies that Cloudflare Access intercepts every URL given as an argument:
# an anonymous request must be redirected to <team>.cloudflareaccess.com
# before any HTML, JS, CSS or other file is served. Exits non-zero otherwise.
#
# Usage: scripts/verify-access.sh https://project.pages.dev/ https://x.project.pages.dev/_next/static/a.js ...
set -uo pipefail
failed=0
for url in "$@"; do
  headers="$(curl -sS -o /dev/null -D - --max-time 25 "$url" 2>&1)"
  status="$(printf '%s\n' "$headers" | awk 'toupper($1) ~ /^HTTP/ {code=$2} END {print code}')"
  location="$(printf '%s\n' "$headers" | tr -d '\r' | awk 'tolower($1)=="location:" {print $2}' | tail -1)"
  if [[ "$status" =~ ^30[1278]$ && "$location" == https://*.cloudflareaccess.com/* ]]; then
    echo "PROTECTED  $status  $url"
  else
    echo "::error::NOT PROTECTED ($status ${location:-no redirect})  $url"
    failed=1
  fi
done
exit "$failed"
