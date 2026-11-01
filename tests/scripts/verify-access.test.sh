#!/usr/bin/env bash
# Tests scripts/verify-access.sh against a local fake server:
#   /          → 302 to <team>.cloudflareaccess.com (protected)
#   /open      → 200 with content (NOT protected)
#   /wrong     → 302 to another site (NOT protected)
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PORT=3401
node -e '
const http = require("http");
http.createServer((req, res) => {
  if (req.url.startsWith("/open")) { res.writeHead(200, {"Content-Type": "text/html"}); return res.end("<html>public</html>"); }
  if (req.url.startsWith("/wrong")) { res.writeHead(302, {Location: "https://evil.example.com/login"}); return res.end(); }
  res.writeHead(302, {Location: "https://myteam.cloudflareaccess.com/cdn-cgi/access/login/x"}); res.end();
}).listen('"$PORT"');
' &
SERVER=$!
trap 'kill $SERVER 2>/dev/null' EXIT
sleep 1
fail=0
bash "$ROOT/scripts/verify-access.sh" "http://127.0.0.1:$PORT/" "http://127.0.0.1:$PORT/_next/static/a.js" >/dev/null || { echo "FAIL: protected URLs rejected"; fail=1; }
bash "$ROOT/scripts/verify-access.sh" "http://127.0.0.1:$PORT/" "http://127.0.0.1:$PORT/open" >/dev/null && { echo "FAIL: open URL accepted"; fail=1; }
bash "$ROOT/scripts/verify-access.sh" "http://127.0.0.1:$PORT/wrong" >/dev/null && { echo "FAIL: foreign redirect accepted"; fail=1; }
bash "$ROOT/scripts/verify-access.sh" "http://127.0.0.1:3999/" >/dev/null 2>&1 && { echo "FAIL: unreachable host accepted"; fail=1; }
[ "$fail" = 0 ] && echo "verify-access tests passed"
exit "$fail"
