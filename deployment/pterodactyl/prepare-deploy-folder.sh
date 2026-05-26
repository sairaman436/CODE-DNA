#!/usr/bin/env bash
set -euo pipefail

OUTPUT_DIR="${1:-CODE-DNA-PTERODACTYL}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
TARGET="${SCRIPT_DIR}/${OUTPUT_DIR}"

case "$(cd "$(dirname "${TARGET}")" && pwd)" in
  "${SCRIPT_DIR}") ;;
  *) echo "Refusing to write outside deployment/pterodactyl"; exit 1 ;;
esac

rm -rf "${TARGET}"
mkdir -p "${TARGET}/deployment/pterodactyl"

copy_filtered() {
  local source="$1"
  local destination="$2"
  mkdir -p "${destination}"
  rsync -a \
    --exclude ".git" \
    --exclude ".next" \
    --exclude ".vercel" \
    --exclude "node_modules" \
    --exclude "__pycache__" \
    --exclude ".pytest_cache" \
    --exclude ".venv" \
    --exclude "venv" \
    --exclude ".env" \
    --exclude ".env.local" \
    --exclude "dev.db" \
    --exclude "prod.db" \
    --exclude "*.pyc" \
    "${source}/" "${destination}/"
}

copy_filtered "${REPO_ROOT}/backend" "${TARGET}/backend"
copy_filtered "${REPO_ROOT}/frontend" "${TARGET}/frontend"
copy_filtered "${REPO_ROOT}/engine" "${TARGET}/engine"
copy_filtered "${SCRIPT_DIR}/single-server" "${TARGET}/deployment/pterodactyl/single-server"

cp "${SCRIPT_DIR}/README.md" "${TARGET}/deployment/pterodactyl/README.md"
cp "${SCRIPT_DIR}/UPLOAD_MANIFEST.md" "${TARGET}/deployment/pterodactyl/UPLOAD_MANIFEST.md"
cp "${SCRIPT_DIR}/.deployignore" "${TARGET}/deployment/pterodactyl/.deployignore"
cp "${REPO_ROOT}/README.md" "${TARGET}/README.md"
cp "${REPO_ROOT}/TEST_REPORT.md" "${TARGET}/TEST_REPORT.md"

cat > "${TARGET}/UPLOAD_THIS_FOLDER.md" <<'EOF'
# CodeDNA Pterodactyl Single-Folder Bundle

Upload this whole folder to your Pterodactyl server.

Install command:

```bash
bash deployment/pterodactyl/single-server/install.sh
```

Startup command:

```bash
bash deployment/pterodactyl/single-server/start.sh
```

Set environment variables from:

```text
deployment/pterodactyl/single-server/.env.example
```
EOF

echo "Prepared deploy folder:"
echo "${TARGET}"
