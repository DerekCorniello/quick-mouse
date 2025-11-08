package backends

import (
	"github.com/go-vgo/robotgo"
)

// RobotgoMouse implements mouse control using robotgo for X11/Windows/macOS
type RobotgoMouse struct{}

// NewRobotgoMouse creates a new robotgo mouse controller
func NewRobotgoMouse() (*RobotgoMouse, error) {
	return &RobotgoMouse{}, nil
}

// MoveRelative moves the mouse by relative amounts
func (m *RobotgoMouse) MoveRelative(dx, dy int32) error {
	x, y := robotgo.GetMousePos()
	robotgo.MoveMouse(int(x)+int(dx), int(y)+int(dy))
	return nil
}

// MoveTo moves the mouse to absolute position
func (m *RobotgoMouse) MoveTo(x, y int) error {
	robotgo.MoveMouse(x, y)
	return nil
}

// Click performs a mouse click
func (m *RobotgoMouse) Click(button string) error {
	switch button {
	case "left":
		robotgo.Click("left")
	case "right":
		robotgo.Click("right")
	case "middle":
		robotgo.Click("center")
	default:
		robotgo.Click("left")
	}
	return nil
}

// Press presses and holds a mouse button
func (m *RobotgoMouse) Press(button string) error {
	switch button {
	case "left":
		robotgo.MouseDown("left")
	case "right":
		robotgo.MouseDown("right")
	case "middle":
		robotgo.MouseDown("center")
	default:
		robotgo.MouseDown("left")
	}
	return nil
}

// Release releases a mouse button
func (m *RobotgoMouse) Release(button string) error {
	switch button {
	case "left":
		robotgo.MouseUp("left")
	case "right":
		robotgo.MouseUp("right")
	case "middle":
		robotgo.MouseUp("center")
	default:
		robotgo.MouseUp("left")
	}
	return nil
}

// GetPosition returns the current mouse position
func (m *RobotgoMouse) GetPosition() (int, int, error) {
	x, y := robotgo.GetMousePos()
	return x, y, nil
}

// Close is a no-op for robotgo
func (m *RobotgoMouse) Close() error {
	return nil
}