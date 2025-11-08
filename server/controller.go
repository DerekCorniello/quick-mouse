package server

import (
	"fmt"
	"log"
)

// takes incoming packets from the websocket and translates them
// into actual mouse stuff it acts as the bridge between network messages and system input.
type PacketController struct {
	mouse       *UniversalMouse
	controlType ControlType
}

// initializes the packet controller with a mouse backend
// detects the display server and sets up the appropriate mouse control system automatically.
func NewPacketController(defaultMode ControlType) (*PacketController, error) {
	mouse, err := NewUniversalMouse()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize mouse: %v", err)
	}

	return &PacketController{
		mouse:       mouse,
		controlType: defaultMode,
	}, nil
}

func (c *PacketController) SetControlType(ct ControlType) {
	c.controlType = ct
}

// takes a deserialized packet and executes the corresponding mouse action
// this is where network commands become actual cursor movements and button presses
func (c *PacketController) ProcessPacket(packet Packet) error {
	switch packet.Type() {
	case MouseMove:
		p := packet.(*MouseMovePacket)
		controlType := c.controlType

		// TODO: test both modes to ensure correct mouse movement behavior
		//		 leaving for now so that both will function the same
		switch controlType {
		case Flat:
			log.Printf("Moving mouse (flat): dx=%d, dy=%d", p.DeltaX, p.DeltaY)
			return c.mouse.MoveRelative(p.DeltaX, p.DeltaY)
		case Remote:
			log.Printf("Moving mouse (remote): dx=%d, dy=%d", p.DeltaX, p.DeltaY)
			return c.mouse.MoveRelative(p.DeltaX, p.DeltaY)
		default:
			return fmt.Errorf("unknown control type: %d", controlType)
		}

	case ScrollMove:
		p := packet.(*ScrollMovePacket)
		log.Printf("Scrolling: delta_x=%d, delta_y=%d", p.DeltaX, p.DeltaY)
		return c.mouse.Scroll(p.DeltaX, p.DeltaY)

	case SwitchMode:
		// toggle between flat and remote control modes
		if c.controlType == Flat {
			c.SetControlType(Remote)
			log.Println("Switched to Remote mode")
		} else {
			c.SetControlType(Flat)
			log.Println("Switched to Flat mode")
		}
		return nil

	case LeftClickUp:
		log.Println("Left click up")
		return c.mouse.Release("left")

	case LeftClickDown:
		log.Println("Left click down")
		return c.mouse.Press("left")

	case RightClickUp:
		log.Println("Right click up")
		return c.mouse.Release("right")

	case RightClickDown:
		log.Println("Right click down")
		return c.mouse.Press("right")

	default:
		return fmt.Errorf("unknown packet type: %s", packet.Type())
	}
}

// shuts down the mouse backend and releases any system resources
// important to call this when the server shuts down to avoid leaving devices in bad states
func (c *PacketController) Close() error {
	return c.mouse.Close()
}
