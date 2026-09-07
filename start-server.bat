@echo off
setlocal
cd /d "%~dp0"

if not exist package.json (
	echo No se encontro package.json en:
	echo %CD%
	pause
	exit /b 1
)

start "The Last Riders - servidor" /D "%~dp0" cmd /k npm start
timeout /t 2 /nobreak >nul
start "" "http://localhost:3000/game/"
