#!/bin/bash

# Installation script for quick-mouse
# This script clones the repo, installs dependencies, builds the project, and generates HTTPS certificates

echo "Installing quick-mouse..."

# Clone the repo if not already in it
if [ ! -f "go.mod" ]; then
    echo "Cloning quick-mouse repository..."
    git clone https://github.com/DerekCorniello/quick-mouse.git .
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clone repository."
        exit 1
    fi
fi

# Function to detect package manager
detect_package_manager() {
    if command -v apt &> /dev/null; then
        echo "apt"
    elif command -v yum &> /dev/null; then
        echo "yum"
    elif command -v pacman &> /dev/null; then
        echo "pacman"
    elif command -v brew &> /dev/null; then
        echo "brew"
    elif command -v apk &> /dev/null; then
        echo "apk"
    else
        echo "unknown"
    fi
}

# Function to install packages
install_package() {
    local package=$1
    local manager=$2
    local install_name=$package
    # Adjust package names for specific managers
    case $manager in
        apt)
            if [ "$package" = "go" ]; then install_name="golang"; fi
            ;;
        yum)
            if [ "$package" = "go" ]; then install_name="golang"; fi
            ;;
        pacman)
            # pacman uses 'go' as is
            ;;
        brew)
            if [ "$package" = "nodejs" ]; then install_name="node"; fi
            ;;
        apk)
            # apk uses 'go' and 'nodejs' as is
            ;;
    esac
    if ! command -v $package &> /dev/null; then
        echo "$package not found. Installing $install_name..."
        case $manager in
            apt)
                sudo apt update && sudo apt install -y $install_name
                ;;
            yum)
                sudo yum install -y $install_name
                ;;
            pacman)
                sudo pacman -S --noconfirm $install_name
                ;;
            brew)
                brew install $install_name
                ;;
            apk)
                sudo apk add $install_name
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

# Detect package manager
MANAGER=$(detect_package_manager)
if [ "$MANAGER" = "unknown" ]; then
    echo "No supported package manager found. Please install dependencies manually: Go, Node.js, OpenSSL"
    exit 1
fi
echo "Detected package manager: $MANAGER"

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