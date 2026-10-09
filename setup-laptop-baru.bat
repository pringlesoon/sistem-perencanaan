@echo off
title Setup Pertama Kali - SAPT Sistem Permohonan Terpusat
cd /d "%~dp0"

echo ========================================================
echo   SETUP PERTAMA KALI DI LAPTOP BARU (SAPT)
echo ========================================================
echo.

:: 1. Cek PHP
where php >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PHP belum terpasang atau belum masuk PATH!
    echo Silakan install PHP ^(minimal versi 8.2^) terlebih dahulu.
    pause
    exit /b
)

:: 2. Cek Composer
where composer >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Composer belum terpasang!
    echo Silakan install Composer dari https://getcomposer.org/
    pause
    exit /b
)

:: 3. Cek Node & NPM
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js / NPM belum terpasang!
    echo Silakan install Node.js dari https://nodejs.org/
    pause
    exit /b
)

echo [1/6] Menyiapkan file konfigurasi .env...
if not exist ".env" (
    copy .env.example .env >nul
    echo       File .env berhasil dibuat dari .env.example.
) else (
    echo       File .env sudah ada.
)

echo.
echo [2/6] Memasang dependensi PHP (composer install)...
call composer install --no-interaction

echo.
echo [3/6] Membuat Application Key...
call php artisan key:generate --force

echo.
echo [4/6] Menyiapkan database SQLite...
if not exist "database\database.sqlite" (
    type nul > "database\database.sqlite"
    echo       File database\database.sqlite berhasil dibuat.
)
call php artisan migrate --seed --force

echo.
echo [5/6] Memasang dependensi Javascript dan build frontend...
call npm install
call npm run build

echo.
echo [6/6] Menghubungkan storage...
call php artisan storage:link

echo.
echo ========================================================
echo   SETUP SELESAI DENGAN SUKSES!
echo ========================================================
echo.
echo Anda sekarang bisa langsung membuka web dengan:
echo  - Klik ganda "jalankan-web.bat"
echo.
pause
