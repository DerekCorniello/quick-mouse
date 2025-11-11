//go:build !linux

package server

import "fmt"

func newWaylandMouse() (MouseController, error) {
	return nil, fmt.Errorf("Wayland backend not supported on this platform")
}
