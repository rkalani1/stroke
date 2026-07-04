#!/bin/sh
set -eu

ROOT="$(git rev-parse --show-toplevel)"
STAGED="$(git diff --cached --name-only --diff-filter=ACMR)"
PRIVATE_DENYLIST_ENV="${STROKE_LEAK_GUARD_PRIVATE_DENYLIST:-}"

if [ -z "$PRIVATE_DENYLIST_ENV" ] && [ -f "$ROOT/scripts/leak-guard-denylist.local.json" ]; then
  PRIVATE_DENYLIST_ENV="$ROOT/scripts/leak-guard-denylist.local.json"
fi

if [ -z "$STAGED" ]; then
  printf 'Leak guard: no staged text file(s) to scan.\n'
  exit 0
fi

if printf '%s\n' "$STAGED" | grep -qx 'scripts/leak-guard-denylist.local.json'; then
  printf '%s\n' 'Leak guard: scripts/leak-guard-denylist.local.json is private and must not be staged.' >&2
  exit 1
fi

TMPDIR="$(mktemp -d "${TMPDIR:-/tmp}/stroke-staged-leak-guard.XXXXXX")"
cleanup() {
  rm -rf "$TMPDIR"
}
trap cleanup EXIT INT TERM

printf '%s\n' "$STAGED" | git checkout-index --index --force --prefix="$TMPDIR/" --stdin
(
  cd "$TMPDIR"
  if [ -n "$PRIVATE_DENYLIST_ENV" ]; then
    export STROKE_LEAK_GUARD_PRIVATE_DENYLIST="$PRIVATE_DENYLIST_ENV"
  fi
  export STROKE_LEAK_GUARD_REQUIRE_PRIVATE=1
  printf '%s\n' "$STAGED" | node "$ROOT/scripts/check-no-institutional-leak.mjs"
)
