package backends

import (
	"fmt"

	"github.com/bendahl/uinput"
)

// WaylandMouse implements mouse control using uinput for Wayland
type WaylandMouse struct {
	device uinput.Mouse
}

// NewWaylandMouse creates a new Wayland mouse controller
func NewWaylandMouse() (*WaylandMouse, error) {
	mouse, err := uinput.CreateMouse("/dev/uinput", []byte("virtual-mouse"))
	if err != nil {
		return nil, fmt.Errorf("failed to create uinput device: %v\n"+
			"Make sure you have permissions. Run:\n"+
			"  sudo modprobe uinput\n"+
			"  sudo usermod -aG input $USER\n"+
			"Then log out and back in.", err)
	}

	return &WaylandMouse{device: mouse}, nil
}

// MoveRelative moves the mouse by relative amounts
func (m *WaylandMouse) MoveRelative(dx, dy int32) error {
	return m.device.Move(dx, dy)
}

// MoveTo moves the mouse to absolute position (not supported with uinput)
func (m *WaylandMouse) MoveTo(x, y int) error {
	return fmt.Errorf("absolute positioning not supported with uinput backend")
}

// Click performs a mouse click
func (m *WaylandMouse) Click(button string) error {
	switch button {
	case "left":
		return m.device.LeftClick()
	case "right":
		return m.device.RightClick()
	case "middle":
		return m.device.MiddleClick()
	default:
		return m.device.LeftClick()
	}
}

// Press presses and holds a mouse button
func (m *WaylandMouse) Press(button string) error {
	switch button {
	case "left":
		return m.device.LeftPress()
	case "right":
		return m.device.RightPress()
	case "middle":
		return m.device.MiddlePress()
	default:
		return m.device.LeftPress()
	}
}

// Release releases a mouse button
func (m *WaylandMouse) Release(button string) error {
	switch button {
	case "left":
		return m.device.LeftRelease()
	case "right":
		return m.device.RightRelease()
	case "middle":
		return m.device.MiddleRelease()
	default:
		return m.device.LeftRelease()
	}
}

// GetPosition returns the current mouse position (not available on Wayland)
func (m *WaylandMouse) GetPosition() (int, int, error) {
	return 0, 0, fmt.Errorf("position not available on Wayland backend")
}

// Close closes the uinput device
func (m *WaylandMouse) Close() error {
	return m.device.Close()
}