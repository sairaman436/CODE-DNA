#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "Installing CodeDNA full stack from ${ROOT_DIR}"

if ! command -v node >/dev/null 2>&1; then
  echo "NodeJS is required for the frontend and backend."
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "npm is required for the frontend and backend."
  exit 1
fi

if ! command -v python >/dev/null 2>&1; then
  echo "Python is required for the analysis engine."
  exit 1
fi

if ! python -m pip --version >/dev/null 2>&1; then
  echo "pip is required for Python dependency installation."
  exit 1
fi

cd "${ROOT_DIR}/backend"
npm ci
npx prisma generate
npx prisma db push

cd "${ROOT_DIR}/frontend"
npm ci
npm run build

cd "${ROOT_DIR}/engine"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m py_compile main.py analyzer.py

echo "CodeDNA full stack is installed."
