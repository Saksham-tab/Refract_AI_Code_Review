@echo off
setlocal EnableExtensions
cd /d "%~dp0"

echo ============================================
echo  Refract - Local Ollama Setup and Startup
echo ============================================

where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Python 3 is required but was not found.
    echo Install Python 3.10 or newer from https://www.python.org/
    pause
    exit /b 1
  )
  set "PYTHON=py -3"
) else (
  set "PYTHON=python"
)

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js 18.18 or newer is required but was not found.
  echo Install Node.js from https://nodejs.org/
  pause
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo ERROR: npm was not found. Reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

echo.
echo [1/5] Preparing the Python environment...
if not exist "backend\.venv\Scripts\python.exe" (
  %PYTHON% -m venv backend\.venv
  if errorlevel 1 (
    echo ERROR: Could not create backend\.venv.
    pause
    exit /b 1
  )
)

call backend\.venv\Scripts\activate.bat
python -m pip install --upgrade pip
python -m pip install -r backend\requirements.txt
if errorlevel 1 (
  echo ERROR: Failed to install backend Python dependencies.
  pause
  exit /b 1
)

echo.
echo [2/5] Preparing frontend dependencies...
cd /d "%~dp0frontend"
if exist package-lock.json (
  call npm ci
) else (
  call npm install
)
if errorlevel 1 (
  echo ERROR: Failed to install frontend dependencies.
  cd /d "%~dp0"
  pause
  exit /b 1
)
cd /d "%~dp0"

echo.
echo [3/5] Checking Ollama...
set "OLLAMA_EXE="
where ollama >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%I in ('where ollama 2^>nul') do if not defined OLLAMA_EXE set "OLLAMA_EXE=%%I"
)

if not defined OLLAMA_EXE (
  if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
)

if not defined OLLAMA_EXE (
  where winget >nul 2>nul
  if errorlevel 1 (
    echo ERROR: Ollama is not installed and winget is unavailable.
    echo Install Ollama from https://ollama.com/download/windows
    pause
    exit /b 1
  )
  echo Ollama is not installed. Installing it with winget...
  call winget install --id Ollama.Ollama -e --accept-package-agreements --accept-source-agreements
  if errorlevel 1 (
    echo ERROR: Ollama installation failed.
    pause
    exit /b 1
  )
  if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" set "OLLAMA_EXE=%LOCALAPPDATA%\Programs\Ollama\ollama.exe"
  if not defined OLLAMA_EXE (
    echo ERROR: Ollama was installed, but its executable was not found.
    pause
    exit /b 1
  )
)

echo.
echo [4/5] Starting Ollama and downloading Qwen 2.5 Coder...
start "Refract Ollama" "%OLLAMA_EXE%" serve
timeout /t 3 /nobreak >nul

"%OLLAMA_EXE%" pull qwen2.5-coder:1.5b
if errorlevel 1 (
  echo ERROR: Could not download qwen2.5-coder:1.5b.
  pause
  exit /b 1
)

echo.
echo [5/5] Starting Refract...
start "Refract Backend" cmd /k cd /d "%~dp0backend" ^&^& .venv\Scripts\python.exe run.py
start "Refract Frontend" cmd /k cd /d "%~dp0frontend" ^&^& npm run dev

timeout /t 5 /nobreak >nul
start "" "http://localhost:5173"

echo.
echo Refract is starting.
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8000
echo Ollama:   http://127.0.0.1:11434
echo.
echo Close this window only if you also want to stop monitoring startup.
endlocal
