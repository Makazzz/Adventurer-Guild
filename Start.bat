@echo off
title adventurer-guild - discord bot
IF EXIST "%ProgramFiles%\nodejs\node.exe" goto :MODULES
IF EXIST "%ProgramFiles(x86)%\nodejs\node.exe" goto :MODULES
IF EXIST "%ProgramW6432%\nodejs\node.exe" (
	:MODULES
	IF EXIST "node_modules" (
		goto :NODE
	) ELSE (
		color 04
		echo node_modules is missing. Please install them before using the bot with this command
		echo 'npm install'
		pause
		goto :EOF
	)
) ELSE (
	color 04
	echo Node.js is not installed. Please install Node.js before using the bot at https://nodejs.org/
	pause
	goto :EOF
)

:NODE
cls
color 0B
node index.js
pause
