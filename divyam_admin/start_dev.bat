@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\user\AppData\Roaming\npm;%PATH%"
set "NODE_OPTIONS=--max-old-space-size=4096"
cd /d "c:\Users\user\Desktop\chatbot\triccu\attendance payroll\divyam_admin"
echo.
echo ========================================
echo   HAMS Admin Panel - Starting...
echo   URL: http://localhost:3000
echo ========================================
echo.
call npx next dev --turbopack=false
