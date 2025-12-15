@echo off
set ELECTRON_DEV=1
node --loader=./node_modules/electron/dist/node-loader.mjs --no-warnings=ExperimentalWarning %~dp0/electron.js
