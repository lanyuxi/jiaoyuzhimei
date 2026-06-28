@echo off
setlocal

cd /d "%~dp0client"

set "NODE_EXE=C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"

if exist "%NODE_EXE%" (
  "%NODE_EXE%" ".\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173
) else (
  npm run dev -- --host 127.0.0.1 --port 5173
)

pause
