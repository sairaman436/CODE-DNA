#!/bin/bash

echo "========================================="
echo "     Starting Code DNA Microservices"
echo "========================================="
echo ""

echo "[1/3] Starting Next.js Frontend (Port 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!

echo "[2/3] Starting Node.js Backend (Port 5000)..."
cd ../backend && npm run dev &
BACKEND_PID=$!

echo "[3/3] Starting Python Engine (Port 8000)..."
cd ../engine && python -m uvicorn main:app --port 8000 --reload &
ENGINE_PID=$!

echo ""
echo "All services are running in the background!"
echo "Press Ctrl+C to stop all services."

# Wait for all background processes
wait $FRONTEND_PID $BACKEND_PID $ENGINE_PID
