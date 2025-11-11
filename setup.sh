#!/bin/bash
set -e

echo "Installing quick-mouse..."

# Clone repo only if not already inside it
if [ ! -f "go.mod" ]; then
  echo "Cloning quick-mouse repository..."
  git clone https://github.com/DerekCorniello/quick-mouse.git quick-mouse
  cd quick-mouse
fi

detect_package_manager() {
  for x in apt yum pacman brew apk; do
    if command -v "$x" >/dev/null 2>&1; then
      echo "$x"
      return
    fi
  done
  echo "unknown"
}

install_package() {
  local pkg=$1
  local mgr=$2
  local install_name="$pkg"

  case $mgr in
  apt)
    [ "$pkg" = "go" ] && install_name="golang"
    [ "$pkg" = "node" ] && install_name="nodejs"
    ;;
  yum)
    [ "$pkg" = "go" ] && install_name="golang"
    ;;
  brew)
    [ "$pkg" = "node" ] && install_name="node"
    ;;
  pacman | apk) ;;
  esac

  if ! command -v "$pkg" >/dev/null 2>&1; then
    echo "$pkg not found. Installing $install_name..."
    case $mgr in
    apt) sudo apt update && sudo apt install -y "$install_name" ;;
    yum) sudo yum install -y "$install_name" ;;
    pacman) sudo pacman -S --noconfirm "$install_name" ;;
    brew) brew install "$install_name" ;;
    apk) sudo apk add "$install_name" ;;
    *)
      echo "Unsupported package manager"
      exit 1
      ;;
    esac
  else
    echo "$pkg already installed."
  fi
}

MANAGER=$(detect_package_manager)
if [ "$MANAGER" = "unknown" ]; then
  echo "Unsupported system. Install Go, Node.js, and OpenSSL manually."
  exit 1
fi

echo "Detected package manager: $MANAGER"

install_package go "$MANAGER"
install_package node "$MANAGER"
install_package openssl "$MANAGER"

echo "Installing Go dependencies..."
go mod tidy

echo "Building Go backend..."
go build -o quick-mouse

echo "Building client..."
cd client
npm install
npm run build
cd ..

mkdir -p certs

echo "Generating TLS certificate..."
openssl req -x509 -newkey rsa:4096 \
  -keyout certs/localhost-key.pem \
  -out certs/localhost.pem \
  -days 365 -nodes -subj "/CN=localhost"

echo "Installation done."
echo "Run with: ./quick-mouse"
