@echo off

npx electron-packager . BirdyImg --platform=win32 --arch=x64 --extra-resource='./resources/asset'  --extra-resource='./resources/lang' --icon=./resources/prflrsmi.ico --prune=true --overwrite && npx electron-packager . BirdyImg --platform=win32 --arch=ia32 --extra-resource='./resources/asset'  --extra-resource='./resources/lang' --icon=./resources/prflrsmi.ico --prune=true --overwrite
REM npx electron-packager . BirdyImg --platform=linux --arch=x64 --extra-resource='./resources/asset'  --extra-resource='./resources/lang' --icon=./resources/prflrsmi.png --prune=true --overwrite