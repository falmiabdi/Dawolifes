@echo off
echo ============================================
echo    Stopping DawoLife Servers
echo ============================================
echo.
echo Stopping Backend Server (Port 4000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo.
echo Stopping Frontend Server (Port 3000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo.
echo ============================================
echo    Servers Stopped
echo ============================================
echo.
pause
