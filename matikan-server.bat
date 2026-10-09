@echo off
title Mematikan Server Laravel
echo Mematikan proses server pada port 8000...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /f /pid %%a >nul 2>&1
)

echo Server Laravel telah berhasil dimatikan.
timeout /t 2 >nul
