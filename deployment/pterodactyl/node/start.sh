#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
BACKEND_PORT="${BACKEND_PORT:-5000}"
PUBLIC_FRONTEND_URL="${PUBLIC_FRONTEND_URL:-http://localhost:${FRONTEND_PORT}}"
PUBLIC_BACKEND_URL="${PUBLIC_BACKEND_URL:-http://localhost:${BACKEND_PORT}}"

export NODE_ENV="${NODE_ENV:-production}"
export PORT="${BACKEND_PORT}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-${PUBLIC_FRONTEND_URL}}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BACKEND_URL}}"
export CODEDNA_CORS_ORIGINS="${CODEDNA_CORS_ORIGINS:-${PUBLIC_FRONTEND_URL}}"

echo "Starting CodeDNA backend on port ${BACKEND_PORT}"
echo "Starting CodeDNA frontend on port ${FRONTEND_PORT}"
echo "Frontend public URL: ${NEXTAUTH_URL}"
echo "Backend public URL: ${NEXT_PUBLIC_API_URL}"

cd "${ROOT_DIR}/backend"
npx prisma generate
npx prisma db push
node src/index.js &
BACKEND_PID=$!

cd "${ROOT_DIR}/frontend"
npm run start -- --hostname 0.0.0.0 --port "${FRONTEND_PORT}" &
FRONTEND_PID=$!

cleanup() {
  echo "Stopping CodeDNA Node services..."
  kill "${BACKEND_PID}" "${FRONTEND_PID}" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait -n "${BACKEND_PID}" "${FRONTEND_PID}"
exit $?
