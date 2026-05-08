@echo off
cd /d "%~dp0"
"C:\nvm4w\nodejs\node.exe" "C:\nvm4w\nodejs\node_modules\npm\bin\npm-cli.js" run dev -- --port 5173
