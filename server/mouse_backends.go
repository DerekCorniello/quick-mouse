package server

import (
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/bendahl/uinput"
	"github.com/go-vgo/robotgo"
)

// represents the detected display server/platform
type DisplayType string

const (
	Wayland DisplayType = "wayland"
	X11     DisplayType = "x11"
	Windows DisplayType = "windows"
	MacOS   DisplayType = "macos"
	Unknown DisplayType = "unknown"
)

// detects which display server/platform we're running on
func DetectDisplayServer() DisplayType {
	system := runtime.GOOS

	switch system {
	case "linux":
		// check XDG_SESSION_TYPE environment variable
		switch sessionType := os.Getenv("XDG_SESSION_TYPE"); sessionType {
		case "wayland":
			return Wayland
		case "x11":
			return X11
		default:
			// fallback is to check WAYLAND_DISPLAY
			if os.Getenv("WAYLAND_DISPLAY") != "" {
				return Wayland
			}

			// fallback is to check DISPLAY (X11)
			if os.Getenv("DISPLAY") != "" {
				return X11
			}

			return Unknown
		}
	case "windows":
		return Windows
	case "darwin":
		return MacOS
	default:
		return Unknown
	}
}

// defines the interface for mouse control backends
type MouseController interface {
	MoveRelative(dx, dy int32) error
	MoveTo(x, y int) error
	Click(button string) error
	Press(button string) error
	Release(button string) error
	GetPosition() (int, int, error)
	Scroll(deltaX, deltaY int32) error
	Close() error
}

// creates a mouse controller for the detected platform
func NewMouseController() (MouseController, error) {
	displayType := DetectDisplayServer()
	fmt.Printf("Detected display server: %s\n", displayType)

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

// unified interface for mouse control
type UniversalMouse struct {
	controller  MouseController
	displayType DisplayType
}

// NewUniversalMouse creates a new universal mouse controller
func NewUniversalMouse() (*UniversalMouse, error) {
	controller, err := NewMouseController()
	if err != nil {
		return nil, err
	}

	return &UniversalMouse{
		controller:  controller,
		displayType: DetectDisplayServer(),
	}, nil
}

func (m *UniversalMouse) MoveRelative(dx, dy int32) error {
	return m.controller.MoveRelative(dx, dy)
}

// NOTE: Not used in main server controller, available for testing/other purposes
func (m *UniversalMouse) MoveTo(x, y int) error {
	return m.controller.MoveTo(x, y)
}

// NOTE: Not used in main server controller, available for testing/other purposes
func (m *UniversalMouse) Click(button string) error {
	return m.controller.Click(button)
}

func (m *UniversalMouse) Press(button string) error {
	return m.controller.Press(button)
}

func (m *UniversalMouse) Release(button string) error {
	return m.controller.Release(button)
}

// NOTE: Not used in main server controller, available for testing/other purposes
func (m *UniversalMouse) GetPosition() (int, int, error) {
	return m.controller.GetPosition()
}

func (m *UniversalMouse) Scroll(deltaX, deltaY int32) error {
	return m.controller.Scroll(deltaX, deltaY)
}

// NOTE: Not used in main server controller, available for testing/other purposes
func (m *UniversalMouse) Drag(dx, dy int32, duration time.Duration) error {
	if err := m.Press("left"); err != nil {
		return err
	}
	time.Sleep(100 * time.Millisecond)

	steps := 20
	for i := range steps {
		nextX := int32(float64(dx) * float64(i+1) / float64(steps))
		nextY := int32(float64(dy) * float64(i+1) / float64(steps))
		prevX := int32(float64(dx) * float64(i) / float64(steps))
		prevY := int32(float64(dy) * float64(i) / float64(steps))

		stepX := nextX - prevX
		stepY := nextY - prevY

		if err := m.MoveRelative(stepX, stepY); err != nil {
			return err
		}
		time.Sleep(duration / time.Duration(steps))
	}

	return m.Release("left")
}

func (m *UniversalMouse) Close() error {
	return m.controller.Close()
}

type RobotgoMouse struct{}

func NewRobotgoMouse() (*RobotgoMouse, error) {
	return &RobotgoMouse{}, nil
}

func (m *RobotgoMouse) MoveRelative(dx, dy int32) error {
	x, y := robotgo.Location()
	robotgo.Move(int(x)+int(dx), int(y)+int(dy))
	return nil
}

func (m *RobotgoMouse) MoveTo(x, y int) error {
	robotgo.Move(x, y)
	return nil
}

func (m *RobotgoMouse) Click(button string) error {
	switch button {
	case "left":
		robotgo.Click("left")
	case "right":
		robotgo.Click("right")
	case "middle":
		robotgo.Click("center")
	default:
		return fmt.Errorf("Unknown robotgo click action %v", button)
	}
	return nil
}

func (m *RobotgoMouse) Press(button string) error {
	switch button {
	case "left":
		robotgo.MouseDown("left")
	case "right":
		robotgo.MouseDown("right")
	case "middle":
		robotgo.MouseDown("center")
	default:
		return fmt.Errorf("Unknown robotgo click action %v", button)
	}
	return nil
}

func (m *RobotgoMouse) Release(button string) error {
	switch button {
	case "left":
		robotgo.MouseUp("left")
	case "right":
		robotgo.MouseUp("right")
	case "middle":
		robotgo.MouseUp("center")
	default:
		return fmt.Errorf("Unknown robotgo click action %v", button)
	}
	return nil
}

func (m *RobotgoMouse) GetPosition() (int, int, error) {
	x, y := robotgo.Location()
	return x, y, nil
}

func (m *RobotgoMouse) Scroll(deltaX, deltaY int32) error {
	// robotgo.Scroll expects (vertical, horizontal) - so Y first, then X
	robotgo.Scroll(int(deltaY), int(deltaX))
	return nil
}

// close is a no-op for robotgo
func (m *RobotgoMouse) Close() error {
	return nil
}

type WaylandMouse struct {
	device uinput.Mouse
}

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

func (m *WaylandMouse) MoveRelative(dx, dy int32) error {
	return m.device.Move(dx, dy)
}

func (m *WaylandMouse) MoveTo(x, y int) error {
	return fmt.Errorf("absolute positioning not supported with uinput backend")
}

func (m *WaylandMouse) Click(button string) error {
	switch button {
	case "left":
		return m.device.LeftClick()
	case "right":
		return m.device.RightClick()
	case "middle":
		return m.device.MiddleClick()
	default:
		return fmt.Errorf("Unknown wayland click action %v", button)
	}
}

func (m *WaylandMouse) Press(button string) error {
	switch button {
	case "left":
		return m.device.LeftPress()
	case "right":
		return m.device.RightPress()
	case "middle":
		return m.device.MiddlePress()
	default:
		return fmt.Errorf("Unknown wayland click action %v", button)
	}
}

func (m *WaylandMouse) Release(button string) error {
	switch button {
	case "left":
		return m.device.LeftRelease()
	case "right":
		return m.device.RightRelease()
	case "middle":
		return m.device.MiddleRelease()
	default:
		return fmt.Errorf("Unknown wayland click action %v", button)
	}
}

func (m *WaylandMouse) GetPosition() (int, int, error) {
	return 0, 0, fmt.Errorf("position not available on Wayland backend")
}

func (m *WaylandMouse) Scroll(deltaX, deltaY int32) error {
	// uinput Wheel takes (isVertical bool, delta int32)
	if deltaY != 0 {
		if err := m.device.Wheel(false, deltaY); err != nil {
			return err
		}
	}
	if deltaX != 0 {
		if err := m.device.Wheel(true, deltaX); err != nil {
			return err
		}
	}
	return nil
}

func (m *WaylandMouse) Close() error {
	return m.device.Close()
}
