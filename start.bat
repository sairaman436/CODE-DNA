@echo off
echo =========================================
echo      Starting Code DNA Microservices
echo =========================================

echo.
echo [1/3] Starting Next.js Frontend (Port 3000)...
start "CodeDNA Frontend" cmd /k "cd frontend && npm run dev"

echo [2/3] Starting Node.js Backend (Port 5000)...
start "CodeDNA Backend" cmd /k "cd backend && npm run dev"

echo [3/3] Starting Python Engine (Port 8000)...
start "CodeDNA Engine" cmd /k "cd engine && python -m uvicorn main:app --port 8000"

echo.
echo All three services have been launched in separate windows!
echo You can now open your browser to http://localhost:3000
echo.
pause
