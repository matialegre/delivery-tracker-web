@echo off
setlocal ENABLEDELAYEDEXPANSION

REM ============================================
REM  TuRemis - Start script (server + ngrok)
REM ============================================

REM Change to script directory
cd /d "%~dp0"

REM --- 1) Ensure dependencies ---
echo [1/5] Checking Node.js and npm...
where node >nul 2>nul || (
  echo ERROR: Node.js is not installed or not in PATH.
  echo Download: https://nodejs.org/
  pause
  exit /b 1
)
where npm >nul 2>nul || (
  echo ERROR: npm is not installed or not in PATH.
  pause
  exit /b 1
)

echo [2/5] Installing npm deps (if needed)...
call npm install --silent

REM --- 2) Start backend server ---
echo [3/5] Starting backend on http://localhost:3000 ...
start "TuRemis Server" cmd /k npm start

REM --- 3) Wait briefly so server boots ---
timeout /t 3 >nul

REM --- 4) Start ngrok (try system ngrok, then npx) ---
echo [4/5] Starting ngrok tunnel to port 3000 ...
set NGROK_CMD=
where ngrok >nul 2>nul && set NGROK_CMD=ngrok

if defined NGROK_CMD (
  start "ngrok" cmd /k ngrok http 3000
) else (
  echo ngrok.exe not found in PATH. Trying npx...
  start "ngrok (npx)" cmd /k npx --yes ngrok@latest http 3000
)

REM --- 5) Open browser ---
echo [5/5] Opening browser...
start "" http://localhost:3000/

echo.
echo =============================================
echo  TuRemis is launching:
echo    - Backend:  http://localhost:3000
echo    - ngrok:    check the ngrok window for URL
echo =============================================
echo Done. You can close this window.
endlocal
