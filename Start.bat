@echo off
title adventurer-guild - discord bot
IF NOT DEFINED node (
	color 04
	echo Node.js is missing please install Node.js before using the bot at https://nodejs.org/
)
IF DEFINED node (
	echo node index.js
)
pause
