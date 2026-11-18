@echo off
:: Change l'encodage de la console en UTF-8
chcp 65001 > nul

:: Définition du caractère d'échappement pour les couleurs
for /f "tokens=1,2 delims=#" %%a in ('"prompt #$H#$E# & echo on & for %%b in (1) do rem"') do set "ESC=%%b"

:: Codes couleurs
set "GREEN=%ESC%[32m"
set "RESET=%ESC%[0m"

:: Versionning
node gversion.js
set /p COMMIT_DATE=<Gdate.ref

:: Interaction utilisateur
set /p choice="Voulez-vous commiter ? (o/n) : "

if /i "%choice%"=="o" (
    echo Git commit avec la date : %GREEN%%COMMIT_DATE%%RESET%
    git add .
    git status
    git commit -m "Commit du %COMMIT_DATE% depuis Android Studio"
    git push -u origin main

) else (
    echo Fin du script sans commit.
)
