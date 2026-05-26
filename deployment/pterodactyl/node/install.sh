#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "Installing CodeDNA Node services from ${ROOT_DIR}"

cd "${ROOT_DIR}/backend"
npm ci
npx prisma generate
npx prisma db push

cd "${ROOT_DIR}/frontend"
npm ci
npm run build

echo "Node services are installed and frontend is built."
