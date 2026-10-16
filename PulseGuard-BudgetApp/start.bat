@echo off
echo ========================================================
echo  PulseGuard - Personal Budget & Expense Management
echo ========================================================
echo.

where node >nul 2>nul
if %errorlevel% neq 0 (
    if exist "C:\Users\RAKSHA\AppData\Roaming\Antigravity\bin\agy-node.cmd" (
        set NODE_CMD="C:\Users\RAKSHA\AppData\Roaming\Antigravity\bin\agy-node.cmd"
    ) else (
        echo [ERROR] Node.js is not found in your system PATH.
        echo Please download and install Node.js (v20+ or v22+) from:
        echo https://nodejs.org
        echo.
        pause
        exit /b 1
    )
) else (
    set NODE_CMD=node
)

echo Starting PulseGuard Budget server on http://localhost:3001 ...
timeout /t 2 >nul
start "" "http://localhost:3001"
%NODE_CMD% server.js
pause
