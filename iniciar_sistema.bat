@echo off
title Iniciando React Estoque

echo Iniciando backend...
start cmd /k "cd /d %~dp0backend && python run.py"

timeout /t 2 /nobreak > nul

echo Iniciando frontend...
start cmd /k "cd /d %~dp0 && npm run dev"

echo Sistema iniciado.
pause