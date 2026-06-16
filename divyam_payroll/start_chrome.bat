@echo off
set "PATH=C:\Program Files\nodejs;C:\Users\user\AppData\Roaming\npm;C:\Users\user\flutter\bin;C:\src\flutter\bin;%PATH%"
cd /d "c:\Users\user\Desktop\chatbot\triccu\attendance payroll\divyam_payroll"
echo Starting HAMS Flutter App in Chrome...
call flutter run -d chrome
