@echo off
title SRISHTI-AI Launcher (Oil India Limited - SIH 2026)
echo =====================================================================
echo           SRISHTI-AI: NEARBY WELLS INTELLIGENCE SYSTEM (NWIS)
echo                Oil India Limited - SIH 2026 (SIH26121)
echo =====================================================================
echo.

echo [1/2] Starting Python FastAPI Backend Server on port 8000...
start "SRISHTI-AI Backend (FastAPI)" cmd /k "cd /d %~dp0 && python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Next.js Frontend Server on port 3000...
start "SRISHTI-AI Frontend (Next.js)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo   Both services are launching in separate windows!
echo   - Backend API:    http://127.0.0.1:8000
echo   - API Swagger:    http://127.0.0.1:8000/docs
echo   - Web Dashboard:  http://localhost:3000
echo   - Field Doghouse: http://localhost:3000/doghouse
echo =====================================================================
echo.
pause
