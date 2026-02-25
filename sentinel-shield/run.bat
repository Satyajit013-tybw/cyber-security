@echo off
echo ==============================================
echo SentinelShield AI - Local Development Launcher
echo ==============================================
echo.

echo [*] Clearing any processes on port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [1/1] Starting Next.js with Turbopack (Port 3000)...
start "SentinelShield - Next.js" cmd /k "npm run dev"

echo.
echo ==============================================
echo Server is starting in a new window!
echo.
echo - App: http://localhost:3000
echo.
echo TIP: First load takes ~10-15 seconds as Next.js
echo      compiles your pages, subsequent loads are fast.
echo ==============================================
pause

