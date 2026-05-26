#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
ENGINE_HOST="${ENGINE_HOST:-0.0.0.0}"
ENGINE_PORTS="${ENGINE_PORTS:-8000,8001,8002}"
PUBLIC_FRONTEND_URL="${PUBLIC_FRONTEND_URL:-http://localhost:${FRONTEND_PORT}}"
PUBLIC_BACKEND_URL="${PUBLIC_BACKEND_URL:-http://localhost:${BACKEND_PORT}}"
LOCAL_ENGINE_URLS=""

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    echo "Use a Pterodactyl egg/container that includes NodeJS, npm, Python, and pip."
    exit 1
  fi
}

warn_missing_env() {
  for key in "$@"; do
    if [[ -z "${!key:-}" ]]; then
      echo "Warning: ${key} is not set."
    fi
  done
}

require_command node
require_command npm
require_command python

warn_missing_env WEBHOOK_SECRET NEXTAUTH_SECRET GITHUB_TOKEN GITHUB_ID GITHUB_SECRET GMAIL_USER GMAIL_APP_PASSWORD NEWSLETTER_TO_EMAIL

IFS=',' read -ra PORTS <<< "${ENGINE_PORTS}"
for port in "${PORTS[@]}"; do
  clean_port="$(echo "${port}" | xargs)"
  if [[ -z "${clean_port}" ]]; then
    continue
  fi

  if [[ -n "${LOCAL_ENGINE_URLS}" ]]; then
    LOCAL_ENGINE_URLS+=","
  fi
  LOCAL_ENGINE_URLS+="http://127.0.0.1:${clean_port}"
done

if [[ -z "${LOCAL_ENGINE_URLS}" ]]; then
  echo "No engine ports configured. Set ENGINE_PORTS=8000,8001,8002"
  exit 1
fi

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${BACKEND_PORT}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-${PUBLIC_FRONTEND_URL}}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BACKEND_URL}}"
export CODEDNA_CORS_ORIGINS="${CODEDNA_CORS_ORIGINS:-${PUBLIC_FRONTEND_URL}}"
export CODEDNA_BACKEND_URL="${CODEDNA_BACKEND_URL:-http://127.0.0.1:${BACKEND_PORT}}"
export ANALYSIS_SERVICE_URLS="${ANALYSIS_SERVICE_URLS:-${LOCAL_ENGINE_URLS}}"
export CODEDNA_ENGINE_PEER_URLS="${CODEDNA_ENGINE_PEER_URLS:-${LOCAL_ENGINE_URLS}}"

PIDS=()

cleanup() {
  echo "Stopping CodeDNA full stack..."
  if [[ "${#PIDS[@]}" -gt 0 ]]; then
    kill "${PIDS[@]}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

echo "Starting CodeDNA engine pool on ports ${ENGINE_PORTS}"
cd "${ROOT_DIR}/engine"
for port in "${PORTS[@]}"; do
  clean_port="$(echo "${port}" | xargs)"
  if [[ -z "${clean_port}" ]]; then
    continue
  fi

  self_url="http://127.0.0.1:${clean_port}"
  echo "Starting engine on ${ENGINE_HOST}:${clean_port}"
  CODEDNA_ENGINE_SELF_URL="${self_url}" python -m uvicorn main:app --host "${ENGINE_HOST}" --port "${clean_port}" &
  PIDS+=("$!")
done

echo "Starting CodeDNA backend on port ${BACKEND_PORT}"
cd "${ROOT_DIR}/backend"
npx prisma generate
npx prisma db push
node src/index.js &
PIDS+=("$!")

echo "Starting CodeDNA frontend on port ${FRONTEND_PORT}"
cd "${ROOT_DIR}/frontend"
npm run start -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" &
PIDS+=("$!")

echo "Frontend public URL: ${NEXTAUTH_URL}"
echo "Backend public URL: ${NEXT_PUBLIC_API_URL}"
echo "Backend engine pool: ${ANALYSIS_SERVICE_URLS}"

wait -n "${PIDS[@]}"
exit $?
