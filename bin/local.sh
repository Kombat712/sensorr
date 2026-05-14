#!/usr/bin/env bash
set -euo pipefail

cleanup() {
  if [[ -n "${SERVER_PID:-}" ]]; then
    kill "${SERVER_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "▶ Starting Sensorr API server..."
yarn server &
SERVER_PID=$!

echo "▶ Starting Sensorr UI dev server..."
yarn dev
