@echo off
:: Change l'encodage de la console en UTF-8
chcp 65001 > nul

:: Versionning
node gversion.js

:: Partie Git
git add .
git status
git commit -m "Commit depuis Android Studio"
git push -u origin main
