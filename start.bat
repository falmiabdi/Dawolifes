@echo off
echo ============================================
echo    Starting DawoLife Application
echo ============================================
echo.
echo Starting Backend Server...
start "Backend - Port 4000" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
start "Frontend - Port 3000" cmd /k "cd web && pnpm dev"
echo.
echo ============================================
echo    Servers Starting...
echo ============================================
echo.
echo Backend:  http://localhost:4000
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
