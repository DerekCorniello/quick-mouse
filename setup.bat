@echo off
REM Installation script for quick-mouse on Windows
REM This script clones the repo, installs dependencies, builds the project, and generates HTTPS certificates

echo Installing quick-mouse...

REM Check if running on Windows
if "%OS%" neq "Windows_NT" (
    echo Error: This script is for Windows. Use setup.sh on Linux/macOS.
    exit /b 1
)

REM Clone the repo if not already in it
if not exist go.mod (
    echo Cloning quick-mouse repository...
    git clone https://github.com/DerekCorniello/quick-mouse.git .
    if %errorlevel% neq 0 (
        echo Error: Failed to clone repository.
        exit /b 1
    )
)

REM Function to install packages using winget or choco
:install_package
setlocal
set PACKAGE=%1
set CHECK_CMD=%PACKAGE%
set INSTALL_NAME=%PACKAGE%
REM Adjust for Windows naming
if "%PACKAGE%"=="nodejs" (
    set CHECK_CMD=node
    set INSTALL_NAME=nodejs
)
where %CHECK_CMD% >nul 2>nul
if %errorlevel% equ 0 (
    echo %PACKAGE% is already installed.
) else (
    echo %PACKAGE% not found. Installing %INSTALL_NAME%...
    REM Try winget first
    where winget >nul 2>nul
    if %errorlevel% equ 0 (
        if "%PACKAGE%"=="go" (
            winget install GoLang.Go
        ) else if "%PACKAGE%"=="nodejs" (
            winget install Microsoft.NodeJS
        ) else (
            winget install %INSTALL_NAME%
        )
    ) else (
        REM Try choco
        where choco >nul 2>nul
        if %errorlevel% equ 0 (
            choco install %INSTALL_NAME% -y
        ) else (
            echo Please install %PACKAGE% manually from https://golang.org/dl/ or https://nodejs.org/
            exit /b 1
        )
    )
)
goto :eof

REM Install Go
call :install_package go

REM Install Node.js
call :install_package nodejs

REM Install OpenSSL (might need manual install)
where openssl >nul 2>nul
if %errorlevel% neq 0 (
    echo OpenSSL not found. Please install from https://slproweb.com/products/Win32OpenSSL.html
    REM Try to install with choco if available
    where choco >nul 2>nul
    if %errorlevel% equ 0 (
        choco install openssl -y
    ) else (
        echo Please install OpenSSL manually.
        exit /b 1
    )
)

REM Install Go dependencies
echo Installing Go dependencies...
go mod tidy

REM Build the Go executable
echo Building the Go executable...
go build -o quick-mouse

REM Build the client
echo Building the client...
cd client
call npm install
call npm run build
cd ..

REM Create certs directory if it doesn't exist
if not exist certs mkdir certs

REM Generate self-signed certificate for localhost
echo Generating self-signed certificate for localhost...
openssl req -x509 -newkey rsa:4096 -keyout certs\localhost-key.pem -out certs\localhost.pem -days 365 -nodes -subj "/CN=localhost"

if %errorlevel% equ 0 (
    echo Installation completed successfully!
    echo Files created:
    echo   - quick-mouse.exe (executable)
    echo   - certs\localhost.pem
    echo   - certs\localhost-key.pem
    echo.
    echo You can now run the server with: quick-mouse.exe
) else (
    echo Error: Failed to generate certificates.
    exit /b 1
)

REM Create certs directory if it doesn't exist
if not exist certs mkdir certs

REM Try to use OpenSSL if available
where openssl >nul 2>nul
if %errorlevel% equ 0 (
    echo Generating self-signed certificate for localhost using OpenSSL...
    openssl req -x509 -newkey rsa:4096 -keyout certs\localhost-key.pem -out certs\localhost.pem -days 365 -nodes -subj "/CN=localhost"
    if %errorlevel% equ 0 (
        echo Certificates generated successfully!
        echo Files created:
        echo   - certs\localhost.pem
        echo   - certs\localhost-key.pem
        echo.
        echo You can now run the server with: go run main.go
        goto :eof
    ) else (
        echo Error: Failed to generate certificates with OpenSSL.
    )
)

REM Fallback to PowerShell
echo OpenSSL not found. Using PowerShell to generate certificate...
powershell -Command "& { $cert = New-SelfSignedCertificate -DnsName 'localhost' -CertStoreLocation 'cert:\LocalMachine\My' -KeyExportPolicy Exportable -NotAfter (Get-Date).AddDays(365); $pwd = ConvertTo-SecureString -String 'password' -Force -AsPlainText; Export-PfxCertificate -Cert $cert -FilePath 'certs\localhost.pfx' -Password $pwd; $cert | Export-Certificate -FilePath 'certs\localhost.crt'; }"

if %errorlevel% equ 0 (
    REM Convert PFX to PEM format if needed (simplified)
    echo Certificates generated successfully using PowerShell!
    echo Files created:
    echo   - certs\localhost.crt (certificate)
    echo   - certs\localhost.pfx (with private key)
    echo.
    echo Note: You may need to convert .pfx to .pem if required by the server.
    echo You can now run the server with: go run main.go
) else (
    echo Error: Failed to generate certificates.
    echo Please install OpenSSL from https://slproweb.com/products/Win32OpenSSL.html and try again.
    exit /b 1
)