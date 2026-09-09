@echo off
set "PATH=%LOCALAPPDATA%\MinGit\cmd;%PATH%"
echo Pushing code to https://github.com/ApurvPandey0199/lumina-blog-app...
git push -u origin main
echo.
echo ============================================================
echo If successful, open https://dashboard.render.com to deploy!
echo ============================================================
pause
