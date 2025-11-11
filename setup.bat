@echo off
setlocal enabledelayedexpansion

:: ===================================================================
:: quick-mouse Installer for Windows
:: Supports: winget (preferred), choco (fallback)
:: Auto-refreshes PATH after installing tools
:: ===================================================================

echo Installing quick-mouse...

:: ---------- Clone Repository ----------
if not exist quick-mouse\go.mod (
    echo Cloning quick-mouse repository...
    git clone https://github.com/DerekCorniello/quick-mouse.git
    if errorlevel 1 (
        echo [ERROR] Failed to clone repository.
        exit /b 1
    )
)

cd quick-mouse || (
    echo [ERROR] Failed to enter quick-mouse directory.
    exit /b 1
)

:: ---------- Install Required Tools ----------
call :install_package go GoLang.Go go
call :install_package nodejs OpenJS.NodeJS node
call :install_package openssl FireDaemon.OpenSSL openssl

:: ---------- Go Backend Build ----------
echo.
echo Installing Go dependencies...
go mod tidy
if errorlevel 1 (
    echo [ERROR] Failed to tidy Go modules.
    exit /b 1
)

echo Building Go executable...
go build -o quick-mouse.exe
if errorlevel 1 (
    echo [ERROR] Failed to build quick-mouse.exe
    exit /b 1
)

:: ---------- Client Build ----------
echo.
echo Building client (Node.js)...
if not exist client\package.json (
    echo [ERROR] client/package.json not found. Is the repo cloned correctly?
    exit /b 1
)

cd client
call npm install
if errorlevel 1 (
    echo [ERROR] npm install failed.
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo [ERROR] npm run build failed.
    exit /b 1
)
cd ..

:: ---------- Certificate Generation ----------
echo.
if not exist certs mkdir certs

:: Check OpenSSL with full path fallback
set "OPENSSL_CMD=openssl"
where openssl >nul 2>nul
if errorlevel 1 (
    :: Try common FireDaemon install path
    set "FD_PATH=%ProgramFiles%\FireDaemon OpenSSL"
    if exist "!FD_PATH!" (
        for /d %%d in ("!FD_PATH!\*") do (
            if exist "%%d\bin\openssl.exe" (
                set "OPENSSL_CMD=%%d\bin\openssl.exe"
                set "PATH=!PATH!;%%d\bin"
                goto :openssl_found
            )
        )
    )
    echo [ERROR] OpenSSL not found in PATH or default install location.
    echo         Install via: winget install FireDaemon.OpenSSL
    exit /b 1
)

:openssl_found
echo Generating TLS certificate for localhost...
"%OPENSSL_CMD%" req -x509 -newkey rsa:4096 ^
    -keyout certs\localhost-key.pem ^
    -out certs\localhost.pem ^
    -days 365 -nodes ^
    -subj "/CN=localhost"
if errorlevel 1 (
    echo [ERROR] Certificate generation failed.
    exit /b 1
)

:: ---------- Success ----------
echo.
echo ========================================
echo Installation completed successfully!
echo ========================================
echo.
echo Executable: quick-mouse.exe
echo Client:     client/dist/ (or client/build/)
echo Certs:      certs\localhost.pem
echo             certs\localhost-key.pem
echo.
echo Run: quick-mouse.exe
echo.
pause
exit /b 0

:: ===================================================================
:: :install_package <name> <winget-id> <check-cmd>
:: Installs package using winget (preferred) or choco (fallback)
:: Auto-refreshes PATH after install
:: ===================================================================
:install_package
set "PKG_NAME=%~1"
set "WINGET_ID=%~2"
set "CHECK_CMD=%~3"

echo Checking for %PKG_NAME%...

where %CHECK_CMD% >nul 2>nul
if not errorlevel 1 (
    echo   [OK] %PKG_NAME% is already installed.
    goto :eof
)

echo   [INSTALL] Installing %PKG_NAME%...

:: Try winget
where winget >nul 2>nul
if not errorlevel 1 (
    echo     Using winget...
    winget install --id %WINGET_ID% --silent --accept-package-agreements --accept-source-agreements
    if errorlevel 1 (
        echo     [WARN] winget install failed, trying choco...
        goto :try_choco
    )

    :: Auto-refresh PATH for common tools
    if /i "%PKG_NAME%"=="go" (
        set "PATH=%PATH%;%ProgramFiles%\Go\bin"
    )
    if /i "%PKG_NAME%"=="nodejs" (
        set "PATH=%PATH%;%ProgramFiles%\nodejs"
    )
    if /i "%PKG_NAME%"=="openssl" (
        call :refresh_openssl_path
    )
    echo   [OK] %PKG_NAME% installed via winget.
    goto :eof
)

:try_choco
:: Try Chocolatey
where choco >nul 2>nul
if not errorlevel 1 (
    echo     Using Chocolatey...
    choco install %PKG_NAME% -y
    if errorlevel 1 (
        echo [ERROR] Failed to install %PKG_NAME% with both winget and choco.
        echo         Please install manually: https://go.dev/dl/, https://nodejs.org, https://slproweb.com/products/Win32OpenSSL.html
        exit /b 1
    )
    echo   [OK] %PKG_NAME% installed via choco.
    goto :eof
)

echo [ERROR] Neither winget nor choco is available.
echo         Please install %PKG_NAME% manually.
exit /b 1

:: ===================================================================
:: :refresh_openssl_path
:: Finds FireDaemon OpenSSL install and adds to PATH
:: ===================================================================
:refresh_openssl_path
set "FD_BASE=%ProgramFiles%\FireDaemon OpenSSL"
if not exist "!FD_BASE!" goto :eof

for /d %%d in ("!FD_BASE!\*") do (
    if exist "%%d\bin\openssl.exe" (
        set "PATH=!PATH!;%%d\bin"
        echo     Added OpenSSL to PATH: %%d\bin
        goto :eof
    )
)
goto :eof
