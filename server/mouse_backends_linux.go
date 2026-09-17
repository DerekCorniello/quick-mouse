//go:build linux

package server

import (
	"fmt"
	"strings"
	"unicode"

	"github.com/bendahl/uinput"
	"github.com/go-vgo/robotgo"
)

type WaylandMouse struct {
	device   uinput.Mouse
	keyboard uinput.Keyboard
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

	keyboard, err := uinput.CreateKeyboard("/dev/uinput", []byte("virtual-keyboard"))
	if err != nil {
		return nil, fmt.Errorf("failed to create uinput keyboard device: %v\n"+
			"Make sure you have permissions. Run:\n"+
			"  sudo modprobe uinput\n"+
			"  sudo usermod -aG input $USER\n"+
			"Then log out and back in.", err)
	}

	return &WaylandMouse{device: mouse, keyboard: keyboard}, nil
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

// uinputKeyCode maps the logical client key names to uinput key codes.
func uinputKeyCode(key string) (int, error) {
	switch key {
	case KeyVolumeUp:
		return uinput.KeyVolumeup, nil
	case KeyVolumeDown:
		return uinput.KeyVolumedown, nil
	case KeyVolumeMute:
		return uinput.KeyMute, nil
	case KeyBackspace:
		return uinput.KeyBackspace, nil
	case KeyEnter:
		return uinput.KeyEnter, nil
	case KeyTab:
		return uinput.KeyTab, nil
	case KeyEscape:
		return uinput.KeyEsc, nil
	case KeyArrowUp:
		return uinput.KeyUp, nil
	case KeyArrowDown:
		return uinput.KeyDown, nil
	case KeyArrowLeft:
		return uinput.KeyLeft, nil
	case KeyArrowRight:
		return uinput.KeyRight, nil
	default:
		return 0, fmt.Errorf("unknown key: %s", key)
	}
}

func (m *WaylandMouse) KeyPress(keys []string) error {
	if len(keys) == 0 {
		return fmt.Errorf("no keys specified")
	}

	codes := make([]int, len(keys))
	for i, key := range keys {
		code, err := uinputKeyCode(key)
		if err != nil {
			return err
		}
		codes[i] = code
	}

	if len(codes) == 1 {
		return m.keyboard.KeyPress(codes[0])
	}

	// combo: hold all keys down, then release in reverse order
	for _, code := range codes {
		if err := m.keyboard.KeyDown(code); err != nil {
			return err
		}
	}
	for i := len(codes) - 1; i >= 0; i-- {
		if err := m.keyboard.KeyUp(codes[i]); err != nil {
			return err
		}
	}
	return nil
}

// keyMapping describes how to produce a character with the uinput keyboard:
// the base key code and whether the (left) shift modifier must be held.
type keyMapping struct {
	code  int
	shift bool
}

func isLetter(r rune) bool {
	return (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z')
}

// letterKey maps a letter to its Linux input-event key code. Linux KEY_*
// codes are laid out in QWERTY row order (KEY_Q..KEY_P, KEY_A..KEY_L,
// KEY_Z..KEY_M), not alphabetical order, so each row is matched by index.
func letterKey(r rune) (keyMapping, bool) {
	lower := unicode.ToLower(r)
	rows := []struct {
		row  string
		base int
	}{
		{"qwertyuiop", uinput.KeyQ},
		{"asdfghjkl", uinput.KeyA},
		{"zxcvbnm", uinput.KeyZ},
	}
	for _, rk := range rows {
		if idx := strings.IndexRune(rk.row, lower); idx >= 0 {
			return keyMapping{rk.base + idx, unicode.IsUpper(r)}, true
		}
	}
	return keyMapping{}, false
}

// charKeyCode maps a printable ASCII rune to its key code (US layout) so it
// can be typed through the virtual keyboard. Non-ASCII runes (emoji, etc.)
// are not supported by raw key codes and return ok=false.
func charKeyCode(r rune) (keyMapping, bool) {
	switch {
	case r >= '1' && r <= '9':
		return keyMapping{uinput.Key1 + int(r-'1'), false}, true
	case r == '0':
		return keyMapping{uinput.Key0, false}, true
	case isLetter(r):
		return letterKey(r)
	}
	switch r {
	case ' ':
		return keyMapping{uinput.KeySpace, false}, true
	case '\n':
		return keyMapping{uinput.KeyEnter, false}, true
	case '\t':
		return keyMapping{uinput.KeyTab, false}, true
	case '`':
		return keyMapping{uinput.KeyGrave, false}, true
	case '~':
		return keyMapping{uinput.KeyGrave, true}, true
	case '-':
		return keyMapping{uinput.KeyMinus, false}, true
	case '_':
		return keyMapping{uinput.KeyMinus, true}, true
	case '=':
		return keyMapping{uinput.KeyEqual, false}, true
	case '+':
		return keyMapping{uinput.KeyEqual, true}, true
	case '[':
		return keyMapping{uinput.KeyLeftbrace, false}, true
	case '{':
		return keyMapping{uinput.KeyLeftbrace, true}, true
	case ']':
		return keyMapping{uinput.KeyRightbrace, false}, true
	case '}':
		return keyMapping{uinput.KeyRightbrace, true}, true
	case '\\':
		return keyMapping{uinput.KeyBackslash, false}, true
	case '|':
		return keyMapping{uinput.KeyBackslash, true}, true
	case ';':
		return keyMapping{uinput.KeySemicolon, false}, true
	case ':':
		return keyMapping{uinput.KeySemicolon, true}, true
	case '\'':
		return keyMapping{uinput.KeyApostrophe, false}, true
	case '"':
		return keyMapping{uinput.KeyApostrophe, true}, true
	case ',':
		return keyMapping{uinput.KeyComma, false}, true
	case '<':
		return keyMapping{uinput.KeyComma, true}, true
	case '.':
		return keyMapping{uinput.KeyDot, false}, true
	case '>':
		return keyMapping{uinput.KeyDot, true}, true
	case '/':
		return keyMapping{uinput.KeySlash, false}, true
	case '?':
		return keyMapping{uinput.KeySlash, true}, true
	case '!':
		return keyMapping{uinput.Key1, true}, true
	case '@':
		return keyMapping{uinput.Key2, true}, true
	case '#':
		return keyMapping{uinput.Key3, true}, true
	case '$':
		return keyMapping{uinput.Key4, true}, true
	case '%':
		return keyMapping{uinput.Key5, true}, true
	case '^':
		return keyMapping{uinput.Key6, true}, true
	case '&':
		return keyMapping{uinput.Key7, true}, true
	case '*':
		return keyMapping{uinput.Key8, true}, true
	case '(':
		return keyMapping{uinput.Key9, true}, true
	case ')':
		return keyMapping{uinput.Key0, true}, true
	}
	return keyMapping{}, false
}

func (m *WaylandMouse) TypeText(text string) error {
	unsupported := []rune{}
	for _, r := range text {
		mapping, ok := charKeyCode(r)
		if !ok {
			unsupported = append(unsupported, r)
			continue
		}
		if mapping.shift {
			if err := m.keyboard.KeyDown(uinput.KeyLeftshift); err != nil {
				return err
			}
		}
		if err := m.keyboard.KeyPress(mapping.code); err != nil {
			return err
		}
		if mapping.shift {
			if err := m.keyboard.KeyUp(uinput.KeyLeftshift); err != nil {
				return err
			}
		}
	}
	if len(unsupported) > 0 {
		return fmt.Errorf("skipped %d unsupported character(s) (ASCII only on uinput): %q", len(unsupported), string(unsupported))
	}
	return nil
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
	if err := m.device.Close(); err != nil {
		return err
	}
	return m.keyboard.Close()
}
