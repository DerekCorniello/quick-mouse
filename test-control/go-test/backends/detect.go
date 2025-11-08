package backends

import (
	"os"
	"runtime"
)

// DisplayType represents the detected display server/platform
type DisplayType string

const (
	Wayland DisplayType = "wayland"
	X11     DisplayType = "x11"
	Windows DisplayType = "windows"
	MacOS   DisplayType = "macos"
	Unknown DisplayType = "unknown"
)

// DetectDisplayServer detects which display server/platform we're running on
func DetectDisplayServer() DisplayType {
	system := runtime.GOOS

	if system == "linux" {
		// Check XDG_SESSION_TYPE environment variable
		sessionType := os.Getenv("XDG_SESSION_TYPE")
		if sessionType == "wayland" {
			return Wayland
		} else if sessionType == "x11" {
			return X11
		}

		// Fallback: check WAYLAND_DISPLAY
		if os.Getenv("WAYLAND_DISPLAY") != "" {
			return Wayland
		}

		// Fallback: check DISPLAY (X11)
		if os.Getenv("DISPLAY") != "" {
			return X11
		}

		return Unknown
	} else if system == "windows" {
		return Windows
	} else if system == "darwin" {
		return MacOS
	}

	return Unknown
}