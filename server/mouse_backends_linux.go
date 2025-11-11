//go:build linux

package server

import (
	"fmt"

	"github.com/bendahl/uinput"
	"github.com/go-vgo/robotgo"
)

type WaylandMouse struct {
	device uinput.Mouse
}

func newWaylandMouse() (MouseController, error) {
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

func (m *WaylandMouse) CenterOnMainDisplay() error {
	mainId := robotgo.GetMainId()
	x, y, w, h := robotgo.GetDisplayBounds(mainId)
	centerX := x + w/2
	centerY := y + h/2

	width, height := robotgo.GetScreenSize()
	touch, err := uinput.CreateTouchPad("/dev/uinput", []byte("center_pad"), 0, int32(width), 0, int32(height))
	if err != nil {
		return fmt.Errorf("failed to create touchpad: %v", err)
	}
	defer touch.Close()
	return touch.MoveTo(int32(centerX), int32(centerY))
}

func (m *WaylandMouse) Close() error {
	return m.device.Close()
}
