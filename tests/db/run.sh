#!/usr/bin/env bash
# Applies the migrations + seed to a throwaway PostgreSQL 16 cluster and runs
# the RLS test suite. Requires PostgreSQL server binaries (initdb, pg_ctl).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PGBIN="${PGBIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
DATA="$(mktemp -d)"
PORT="${PGPORT_TEST:-55432}"
cleanup() { "$PGBIN/pg_ctl" -D "$DATA" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$DATA"; }
trap cleanup EXIT
if [ "$(id -u)" = "0" ]; then
  chown -R postgres "$DATA"
  RUN=(su postgres -c)
else
  RUN=(bash -c)
fi
"${RUN[@]}" "$PGBIN/initdb -D $DATA -U postgres -A trust >/dev/null"
"${RUN[@]}" "$PGBIN/pg_ctl -D $DATA -o '-p $PORT -k /tmp' -l $DATA/log -w start >/dev/null"
PSQL=(psql -h /tmp -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/tests/db/supabase-stub.sql"
# Apply every migration in order (the storage one needs Supabase's storage schema).
for f in "$ROOT"/supabase/migrations/*.sql; do
  case "$f" in *_storage.sql) continue ;; esac
  "${PSQL[@]}" -f "$f"
done
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
# The seed must be safe to re-run: no duplicate crops, windows or tasks.
"${PSQL[@]}" -f "$ROOT/supabase/seed.sql"
"${PSQL[@]}" -f "$ROOT/tests/db/rls.test.sql"
