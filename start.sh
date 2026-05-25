#!/bin/bash

echo "========================================="
echo "     Starting Code DNA Microservices"
echo "========================================="
echo ""

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
ENGINE_POOL="http://localhost:8000,http://localhost:8001,http://localhost:8002"

echo "[1/3] Starting Next.js Frontend (Port 3000)..."
(cd "$ROOT_DIR/frontend" && npm run dev) &
FRONTEND_PID=$!

echo "[2/3] Starting Node.js Backend (Port 5000)..."
(cd "$ROOT_DIR/backend" && ANALYSIS_SERVICE_URLS="$ENGINE_POOL" npm run dev) &
BACKEND_PID=$!

echo "[3/3] Starting Python Engine Pool (Ports 8000, 8001, 8002)..."
(cd "$ROOT_DIR/engine" && CODEDNA_ENGINE_SELF_URL=http://localhost:8000 CODEDNA_ENGINE_PEER_URLS="$ENGINE_POOL" python -m uvicorn main:app --port 8000) &
ENGINE_PID=$!
(cd "$ROOT_DIR/engine" && CODEDNA_ENGINE_SELF_URL=http://localhost:8001 CODEDNA_ENGINE_PEER_URLS="$ENGINE_POOL" python -m uvicorn main:app --port 8001) &
ENGINE_PID_2=$!
(cd "$ROOT_DIR/engine" && CODEDNA_ENGINE_SELF_URL=http://localhost:8002 CODEDNA_ENGINE_PEER_URLS="$ENGINE_POOL" python -m uvicorn main:app --port 8002) &
ENGINE_PID_3=$!

echo ""
echo "All services are running in the background!"
echo "Press Ctrl+C to stop all services."

# Wait for all background processes
wait $FRONTEND_PID $BACKEND_PID $ENGINE_PID $ENGINE_PID_2 $ENGINE_PID_3
