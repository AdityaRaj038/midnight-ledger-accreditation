#!/usr/bin/env bash
# Compile Compact contracts using the `compact` CLI.
#
# Install compact CLI:
#   https://docs.midnight.network/develop/tutorial/1-setup
#   (download the binary for your OS and add it to PATH)
#
# Usage: ./scripts/compile.sh [contract_name]
#   contract_name: accreditation | founder_majority (omit to compile all)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONTRACTS_DIR="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$CONTRACTS_DIR/src"
MANAGED_DIR="$SRC_DIR/managed"

compile_contract() {
  local name="$1"
  local src="$SRC_DIR/$name.compact"
  local out="$MANAGED_DIR/$name"

  if [ ! -f "$src" ]; then
    echo "ERROR: $src not found" >&2
    exit 1
  fi

  mkdir -p "$out"

  echo "Compiling $name.compact..."
  "$COMPACT_BIN" compile "$src" "$out"
  echo "  -> src/managed/$name/"
}

if [ "${OS:-}" = "Windows_NT" ] || uname -s | grep -qiE 'mingw|msys|cygwin'; then
  # Do not auto-discover on Windows: `compact.exe` is an NTFS utility, not
  # Midnight Compact. Use WSL or explicitly set COMPACT_BIN to real compiler.
  COMPACT_BIN="${COMPACT_BIN:-}"
else
  COMPACT_BIN="${COMPACT_BIN:-$(command -v compact 2>/dev/null || true)}"
fi
if [ -z "$COMPACT_BIN" ] && [ -x "$HOME/.local/bin/compact" ]; then
  COMPACT_BIN="$HOME/.local/bin/compact"
fi

# Windows ships an unrelated NTFS compression utility named compact.exe. It
# accepts arbitrary arguments and can hang instead of compiling a contract.
case "${COMPACT_BIN,,}" in
  *windows/system32/compact.exe|*windows\\system32\\compact.exe)
    COMPACT_BIN=""
    ;;
esac

if [ -z "$COMPACT_BIN" ]; then
  echo "ERROR: 'compact' CLI not found on PATH." >&2
  echo "Install it from: https://docs.midnight.network/develop/tutorial/1-setup" >&2
  exit 1
fi

if [ "${1:-}" != "" ]; then
  compile_contract "$1"
else
  compile_contract accreditation
  compile_contract founder_majority
fi

echo ""
echo "Done. Compiled artifacts in contracts/src/managed/"
