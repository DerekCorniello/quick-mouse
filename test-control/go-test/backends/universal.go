package backends

import (
	"time"
)

// UniversalMouse provides a unified interface for mouse control
type UniversalMouse struct {
	controller MouseController
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

// MoveRelative moves mouse by relative amount
func (m *UniversalMouse) MoveRelative(dx, dy int32) error {
	return m.controller.MoveRelative(dx, dy)
}

// MoveTo moves mouse to absolute position
func (m *UniversalMouse) MoveTo(x, y int) error {
	return m.controller.MoveTo(x, y)
}

// Click performs a mouse click
func (m *UniversalMouse) Click(button string) error {
	return m.controller.Click(button)
}

// Press presses and holds a button
func (m *UniversalMouse) Press(button string) error {
	return m.controller.Press(button)
}

// Release releases a button
func (m *UniversalMouse) Release(button string) error {
	return m.controller.Release(button)
}

// GetPosition gets current mouse position
func (m *UniversalMouse) GetPosition() (int, int, error) {
	return m.controller.GetPosition()
}

// Drag performs a drag operation
func (m *UniversalMouse) Drag(dx, dy int32, duration time.Duration) error {
	if err := m.Press("left"); err != nil {
		return err
	}
	time.Sleep(100 * time.Millisecond)

	steps := 20
	for i := 0; i < steps; i++ {
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

// Close closes the mouse controller
func (m *UniversalMouse) Close() error {
	return m.controller.Close()
}