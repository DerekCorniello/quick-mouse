package server

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"time"

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
	KeyPress(keys []string) error
	TypeText(text string) error
	CenterOnMainDisplay() error
	Close() error
}

// creates a mouse controller for the detected platform
func NewMouseController() (MouseController, error) {
	displayType := DetectDisplayServer()
	log.Printf("Detected display server: %s", displayType)

	switch displayType {
	case Wayland:
		log.Printf("Using uinput backend")
		return newWaylandMouse()
	case X11, Windows, MacOS:
		log.Printf("Using robotgo backend")
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

func (m *UniversalMouse) KeyPress(keys []string) error {
	return m.controller.KeyPress(keys)
}

func (m *UniversalMouse) TypeText(text string) error {
	return m.controller.TypeText(text)
}

func (m *UniversalMouse) CenterOnMainDisplay() error {
	return m.controller.CenterOnMainDisplay()
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

// robotgoKeyName maps the logical client key names to robotgo's media key names.
func robotgoKeyName(key string) (string, error) {
	switch key {
	case KeyVolumeUp:
		return "audio_vol_up", nil
	case KeyVolumeDown:
		return "audio_vol_down", nil
	case KeyVolumeMute:
		return "audio_mute", nil
	case KeyBackspace:
		return "backspace", nil
	case KeyEnter:
		return "enter", nil
	case KeyTab:
		return "tab", nil
	case KeyEscape:
		return "esc", nil
	case KeyArrowUp:
		return "up", nil
	case KeyArrowDown:
		return "down", nil
	case KeyArrowLeft:
		return "left", nil
	case KeyArrowRight:
		return "right", nil
	default:
		return "", fmt.Errorf("unknown key: %s", key)
	}
}

func (m *RobotgoMouse) KeyPress(keys []string) error {
	if len(keys) == 0 {
		return fmt.Errorf("no keys specified")
	}

	names := make([]string, len(keys))
	for i, key := range keys {
		name, err := robotgoKeyName(key)
		if err != nil {
			return err
		}
		names[i] = name
	}

	if len(names) == 1 {
		return robotgo.KeyTap(names[0])
	}

	// combo: hold all keys down, then release in reverse order
	for _, name := range names {
		if err := robotgo.KeyToggle(name, "down"); err != nil {
			return err
		}
	}
	time.Sleep(50 * time.Millisecond)
	for i := len(names) - 1; i >= 0; i-- {
		if err := robotgo.KeyToggle(names[i], "up"); err != nil {
			return err
		}
	}
	return nil
}

// TypeText types a string using robotgo's Unicode-aware keyboard handler,
// which works on X11, Windows, and macOS. Use the uinput backend on Wayland.
func (m *RobotgoMouse) TypeText(text string) error {
	robotgo.TypeStr(text)
	return nil
}

func (m *RobotgoMouse) Scroll(deltaX, deltaY int32) error {
	robotgo.Scroll(int(deltaX), int(deltaY))
	return nil
}

func (m *RobotgoMouse) CenterOnMainDisplay() error {
	mainId := robotgo.GetMainId()
	x, y, w, h := robotgo.GetDisplayBounds(mainId)
	centerX := x + w/2
	centerY := y + h/2
	return m.MoveTo(centerX, centerY)
}

// close is a no-op for robotgo
func (m *RobotgoMouse) Close() error {
	return nil
}
