@echo off
set "PATH=C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin;%PATH%"
cd /d "%~dp0..\client"
"C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" ".\node_modules\vite\bin\vite.js" --host 127.0.0.1 --port 5173 --strictPort
pause
