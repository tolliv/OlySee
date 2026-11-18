@echo off
:: Change l'encodage de la console en UTF-8
chcp 65001 > nul

:: Versionning
node gversion.js
set /p COMMIT_DATE=<Gdate.ref
echo Git commit avec la date : %COMMIT_DATE%

:: Interaction utilisateur
set /p choice="Voulez-vous commiter ? (o/n) : "

if /i "%choice%"=="o" (
    git add .
    git status
    git commit -m "Commit du %COMMIT_DATE% depuis Android Studio"
    git push -u origin main

) else (
    echo Fin du script sans commit.
)
