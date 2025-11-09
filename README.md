# Quick Mouse

A wireless mouse solution that turns your smartphone into a fully-functional input device for your computer.

## Overview

Quick Mouse was built by UC computer science students who needed a reliable way to control computers without carrying extra hardware. Whether you forgot your mouse, need to present slides remotely, or want a quick navigation tool, Quick Mouse provides a seamless wireless input experience.

## Features

- **Multiple Input Modes**: Traditional mouse, handheld pointer, or trackpad
- **QR Code Pairing**: Instant secure connection with no manual configuration
- **Low Latency**: Optimized for real-time control even on shared WiFi networks
- **Cross-Platform**: Works on Windows, macOS, and Linux
- **No Extra Hardware**: Uses devices you already have

## Installation

### Windows

1. Download the latest release
2. Run the installation script:
   ```bash
   setup.bat
   ```
3. Launch Quick Mouse Desktop from your Start Menu

### Linux

1. Download the latest release
2. Make the script executable and run:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. Launch Quick Mouse Desktop from your applications menu

### macOS

1. Download the latest release
2. Run the installation script:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
3. Launch Quick Mouse Desktop from your Applications folder

## Getting Started

1. **Start the Desktop App**: Launch Quick Mouse on your computer
2. **Scan QR Code**: Open Quick Mouse on your phone and scan the displayed QR code
3. **Start Controlling**: Your phone is now a wireless mouse

## Technical Stack

- **Backend**: Go - lightweight service for pairing, event processing, and native pointer control
- **Frontend**: React - intuitive touch and gesture interface
- **Communication**: WebSocket-based event streaming for minimal latency
- **Security**: Encrypted pairing through QR-code exchange

## How It Works

Quick Mouse establishes a local WebSocket connection between your phone and computer. Touch events are captured by the React frontend and streamed to the Go backend, which translates them into native pointer actions with minimal delay.

## Development

Built with a focus on:

- Real-time event handling and network performance
- Cross-platform compatibility and input normalization
- Secure device pairing with user-friendly flows
- Gesture detection that balances precision and usability

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

MIT License. See `LICENSE` for details.
