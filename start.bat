@echo off
title OmniAgent OS - 1-Click Launcher
echo ========================================================
echo         OMNIAGENT OS - 1-CLICK LAUNCHER
echo ========================================================
echo.

echo [1/3] Verification de Python et des dependances...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERREUR: Python n'est pas installe ou n'est pas dans le PATH.
    pause
    exit /b 1
)

echo [2/3] Demarrage du Backend FastAPI (Port 8000)...
start "OmniAgent Backend Gateway" cmd /c "uvicorn server.app:app --host 0.0.0.0 --port 8000"

echo [3/3] Demarrage du Frontend Web Studio (Port 3000)...
cd apps\web
start "OmniAgent Web Studio" cmd /c "npm run dev"

echo.
echo ========================================================
echo  OmniAgent OS est en cours d'execution !
echo  - API Gateway : http://localhost:8000
echo  - Web Studio  : http://localhost:3000
echo ========================================================
echo.
timeout /t 3 >nul
start http://localhost:3000
