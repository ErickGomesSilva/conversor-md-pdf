@echo off
chcp 65001 >nul
title Conversor de Markdown para PDF
cd /d "%~dp0"

set "URL=http://localhost:3847"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao foi encontrado. Instale em https://nodejs.org
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Instalando dependencias na primeira execucao...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar as dependencias.
    pause
    exit /b 1
  )
)

curl.exe -s -o NUL --connect-timeout 1 "%URL%" >nul 2>nul
if not errorlevel 1 (
  echo O conversor ja esta em execucao. Abrindo o navegador...
  start "" "%URL%"
  exit /b 0
)

echo Iniciando o conversor em %URL%
echo Feche esta janela para encerrar a aplicacao.
echo.

start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process '%URL%'"
node server.js
if errorlevel 1 pause
