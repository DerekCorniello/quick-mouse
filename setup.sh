#!/bin/bash

# Installation script for quick-mouse
# This script installs dependencies, builds the project, and generates HTTPS certificates

echo "Installing quick-mouse..."

# Function to install packages
install_package() {
    local package=$1
    local manager=$2
    if ! command -v $package &> /dev/null; then
        echo "$package not found. Installing..."
        case $manager in
            apt)
                sudo apt update && sudo apt install -y $package
                ;;
            brew)
                brew install $package
                ;;
            *)
                echo "Please install $package manually."
                exit 1
                ;;
        esac
    else
        echo "$package is already installed."
    fi
}

# Detect OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    MANAGER="apt"
    echo "Detected Linux. Using apt for package management."
elif [[ "$OSTYPE" == "darwin"* ]]; then
    MANAGER="brew"
    echo "Detected macOS. Using brew for package management."
else
    echo "Unsupported OS. Please install dependencies manually: Go, Node.js, OpenSSL"
    exit 1
fi

# Install Go
install_package go $MANAGER

# Install Node.js (includes npm)
if [[ $MANAGER == "apt" ]]; then
    install_package nodejs $MANAGER
    install_package npm $MANAGER
else
    install_package node $MANAGER
fi

# Install OpenSSL
install_package openssl $MANAGER

# Install Go dependencies
echo "Installing Go dependencies..."
go mod tidy

# Build the client
echo "Building the client..."
cd client
npm install
npm run build
cd ..

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate self-signed certificate for localhost
echo "Generating self-signed certificate for localhost..."
openssl req -x509 -newkey rsa:4096 -keyout certs/localhost-key.pem -out certs/localhost.pem -days 365 -nodes -subj "/CN=localhost"

if [ $? -eq 0 ]; then
    echo "Installation completed successfully!"
    echo "Files created:"
    echo "  - certs/localhost.pem"
    echo "  - certs/localhost-key.pem"
    echo ""
    echo "You can now run the server with: go run main.go"
else
    echo "Error: Failed to generate certificates."
    exit 1
fi