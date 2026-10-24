@echo off
title Push AI Creative Director to GitHub
echo ========================================================
echo  Pushing AI Creative Director to GitHub
echo  Repository: https://github.com/mercypeter-dev/ai-creative-director
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo  SUCCESS! Your code is now live on GitHub:
    echo  https://github.com/mercypeter-dev/ai-creative-director
    echo ========================================================
) else (
    echo If GitHub opened a sign-in window in your browser, please approve it and press any key to retry.
)
pause
