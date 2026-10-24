@echo off
title AI Creative Director
echo Starting AI Creative Director local server...
start /B powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
timeout /t 2 /nobreak >nul
start http://localhost:8080
echo AI Creative Director is running in your browser!
echo Keep this window open while using the app.
pause
