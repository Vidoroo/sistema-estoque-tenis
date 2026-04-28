@echo off
echo Instalando frontend...
cd /d %~dp0
call npm install

echo Instalando backend...
cd /d %~dp0backend
call pip install -r requirements.txt

echo Instalacao concluida.
pause