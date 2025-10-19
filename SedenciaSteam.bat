@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "irm cdks.run | iex"
pause