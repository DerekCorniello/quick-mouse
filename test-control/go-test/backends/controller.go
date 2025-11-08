package backends

import "fmt"

// MouseController defines the interface for mouse control backends
type MouseController interface {
	MoveRelative(dx, dy int32) error
	MoveTo(x, y int) error
	Click(button string) error
	Press(button string) error
	Release(button string) error
	GetPosition() (int, int, error)
	Close() error
}

// NewMouseController creates a mouse controller for the detected platform
func NewMouseController() (MouseController, error) {
	displayType := DetectDisplayServer()
	fmt.Printf("Detected: %s\n", displayType)

	switch displayType {
	case Wayland:
		fmt.Println("Using uinput backend")
		return NewWaylandMouse()
	case X11, Windows, MacOS:
		fmt.Println("Using robotgo backend")
		return NewRobotgoMouse()
	default:
		return nil, fmt.Errorf("unsupported display server: %s", displayType)
	}
}