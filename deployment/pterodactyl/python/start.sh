#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
ENGINE_HOST="${ENGINE_HOST:-0.0.0.0}"
ENGINE_PORTS="${ENGINE_PORTS:-8000,8001,8002}"

cd "${ROOT_DIR}/engine"

IFS=',' read -ra PORTS <<< "${ENGINE_PORTS}"
PIDS=()

for port in "${PORTS[@]}"; do
  clean_port="$(echo "${port}" | xargs)"
  if [[ -z "${clean_port}" ]]; then
    continue
  fi

  self_url="${CODEDNA_ENGINE_PUBLIC_BASE_URL:-http://127.0.0.1}:${clean_port}"
  if [[ -n "${CODEDNA_ENGINE_SELF_URL:-}" && "${#PORTS[@]}" -eq 1 ]]; then
    self_url="${CODEDNA_ENGINE_SELF_URL}"
  fi

  echo "Starting CodeDNA engine on ${ENGINE_HOST}:${clean_port}"
  CODEDNA_ENGINE_SELF_URL="${self_url}" python -m uvicorn main:app --host "${ENGINE_HOST}" --port "${clean_port}" &
  PIDS+=("$!")
done

if [[ "${#PIDS[@]}" -eq 0 ]]; then
  echo "No engine ports configured. Set ENGINE_PORTS=8000,8001,8002"
  exit 1
fi

cleanup() {
  echo "Stopping CodeDNA engine pool..."
  kill "${PIDS[@]}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait -n "${PIDS[@]}"
exit $?
