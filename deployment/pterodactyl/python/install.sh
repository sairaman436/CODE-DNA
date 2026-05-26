#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "Installing CodeDNA Python engine from ${ROOT_DIR}"

cd "${ROOT_DIR}/engine"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m py_compile main.py analyzer.py

echo "Python engine dependencies are installed."
