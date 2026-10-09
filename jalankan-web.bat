@echo off
title SAPT - Sistem Permohonan Terpusat
cd /d "%~dp0"

echo ========================================================
echo        SAPT - Sistem Permohonan Terpusat
echo        Database: SQLite (Tanpa XAMPP / Tanpa Herd)
echo ========================================================
echo.
echo [1/2] Menyalakan server Laravel...
echo [2/2] Browser akan terbuka otomatis dalam 2 detik...
echo.
echo ========================================================
echo   PENTING: JANGAN TUTUP JENDELA INI!
echo   Website hanya bisa diakses selama jendela ini terbuka.
echo ========================================================
echo.

:: Tunggu 2 detik di background lalu buka browser
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://127.0.0.1:8000"

:: Jalankan server Laravel
php artisan serve --port=8000
pause
