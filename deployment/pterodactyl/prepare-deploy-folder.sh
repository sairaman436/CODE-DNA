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
cp "${SCRIPT_DIR}/single-server/.env.example" "${TARGET}/.env.example"
cp "${SCRIPT_DIR}/single-server/PRE_DEPLOY_CHECKLIST.md" "${TARGET}/PRE_DEPLOY_CHECKLIST.md"

cp "${SCRIPT_DIR}/README.md" "${TARGET}/deployment/pterodactyl/README.md"
cp "${SCRIPT_DIR}/UPLOAD_MANIFEST.md" "${TARGET}/deployment/pterodactyl/UPLOAD_MANIFEST.md"
cp "${SCRIPT_DIR}/.deployignore" "${TARGET}/deployment/pterodactyl/.deployignore"
cp "${REPO_ROOT}/README.md" "${TARGET}/README.md"
cp "${REPO_ROOT}/TEST_REPORT.md" "${TARGET}/TEST_REPORT.md"

cat > "${TARGET}/start.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CODEDNA_ROOT_DIR="${ROOT_DIR}"
exec bash "${ROOT_DIR}/deployment/pterodactyl/single-server/start.sh"
EOF

cat > "${TARGET}/install.sh" <<'EOF'
#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export CODEDNA_ROOT_DIR="${ROOT_DIR}"
exec bash "${ROOT_DIR}/deployment/pterodactyl/single-server/install.sh"
EOF

chmod +x "${TARGET}/start.sh" "${TARGET}/install.sh"

cat > "${TARGET}/UPLOAD_THIS_FOLDER.md" <<'EOF'
# CodeDNA Pterodactyl Single-Folder Bundle

Upload this whole folder to your Pterodactyl server.

Startup command:

```bash
bash start.sh
```

The startup command installs and builds on first run, then starts everything.

Set environment variables from:

```text
.env.example
```
EOF

echo "Prepared deploy folder:"
echo "${TARGET}"
