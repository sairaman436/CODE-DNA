@echo off
echo =========================================
echo      Starting Code DNA Microservices
echo =========================================

echo.
echo [1/3] Starting Next.js Frontend (Port 3000)...
start "CodeDNA Frontend" cmd /k "cd frontend && npm run dev"

echo [2/3] Starting Node.js Backend (Port 5000)...
start "CodeDNA Backend" cmd /k "set ANALYSIS_SERVICE_URLS=http://localhost:8000,http://localhost:8001,http://localhost:8002&& cd backend && npm run dev"

echo [3/3] Starting Python Engine Pool (Ports 8000, 8001, 8002)...
start "CodeDNA Engine 8000" cmd /k "set CODEDNA_ENGINE_SELF_URL=http://localhost:8000&& set CODEDNA_ENGINE_PEER_URLS=http://localhost:8000,http://localhost:8001,http://localhost:8002&& set CODEDNA_SOURCE_FETCH_MODE=api&& set CODEDNA_DISTRIBUTED_BATCH_SIZE=0&& set CODEDNA_ENGINE_WORKERS=1&& set CODEDNA_MAX_REPO_WORKERS=2&& set CODEDNA_FILE_ANALYSIS_WORKERS=4&& cd engine && python -m uvicorn main:app --port 8000"
start "CodeDNA Engine 8001" cmd /k "set CODEDNA_ENGINE_SELF_URL=http://localhost:8001&& set CODEDNA_ENGINE_PEER_URLS=http://localhost:8000,http://localhost:8001,http://localhost:8002&& set CODEDNA_SOURCE_FETCH_MODE=api&& set CODEDNA_DISTRIBUTED_BATCH_SIZE=0&& set CODEDNA_ENGINE_WORKERS=1&& set CODEDNA_MAX_REPO_WORKERS=2&& set CODEDNA_FILE_ANALYSIS_WORKERS=4&& cd engine && python -m uvicorn main:app --port 8001"
start "CodeDNA Engine 8002" cmd /k "set CODEDNA_ENGINE_SELF_URL=http://localhost:8002&& set CODEDNA_ENGINE_PEER_URLS=http://localhost:8000,http://localhost:8001,http://localhost:8002&& set CODEDNA_SOURCE_FETCH_MODE=api&& set CODEDNA_DISTRIBUTED_BATCH_SIZE=0&& set CODEDNA_ENGINE_WORKERS=1&& set CODEDNA_MAX_REPO_WORKERS=2&& set CODEDNA_FILE_ANALYSIS_WORKERS=4&& cd engine && python -m uvicorn main:app --port 8002"

echo.
echo Frontend, backend, and three engine workers have been launched in separate windows!
echo You can now open your browser to http://localhost:3000
echo.
pause
