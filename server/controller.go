package server

import (
	"fmt"
	"log"
	"math"
	"sync"
	"time"
)

// takes incoming packets from the websocket and translates them
// into actual mouse stuff it acts as the bridge between network messages and system input.
type PacketController struct {
	mouse       *UniversalMouse
	controlType ControlType

	// Physics state for device motion integration
	physicsMu     sync.RWMutex
	velocityX     float64
	velocityY     float64
	lastUpdate    time.Time
	sensitivity   float64
	friction      float64
	maxVelocity   float64
	accelDeadzone float64
	rotDeadzone   float64
	isRunning     bool
	stopPhysics   chan struct{}
}

// initializes the packet controller with a mouse backend
// detects the display server and sets up the appropriate mouse control system automatically.
func NewPacketController(defaultMode ControlType) (*PacketController, error) {
	mouse, err := NewUniversalMouse()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize mouse: %v", err)
	}

	controller := &PacketController{
		mouse:         mouse,
		controlType:   Flat,  // Start in Flat mode to match client default
		sensitivity:   0.3,   // Reduced sensitivity for smoother control
		friction:      0.92,  // Velocity decay per frame (8% loss)
		maxVelocity:   100.0, // Maximum velocity cap
		accelDeadzone: 0.05,  // Minimum acceleration to process
		rotDeadzone:   0.1,   // Minimum rotation rate to process
		stopPhysics:   make(chan struct{}),
		lastUpdate:    time.Now(),
	}

	// Start physics update loop
	controller.startPhysicsLoop()

	return controller, nil
}

// starts the physics integration loop that runs at 60fps
func (c *PacketController) startPhysicsLoop() {
	c.isRunning = true
	log.Println("Starting physics loop")
	go func() {
		ticker := time.NewTicker(16 * time.Millisecond) // ~60fps
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				c.updatePhysics()
			case <-c.stopPhysics:
				log.Println("Stopping physics loop")
				return
			}
		}
	}()
}

// updates physics state and sends mouse movements
func (c *PacketController) updatePhysics() {
	c.physicsMu.Lock()
	defer c.physicsMu.Unlock()

	now := time.Now()
	dt := now.Sub(c.lastUpdate).Seconds()
	c.lastUpdate = now

	if dt > 0.1 { // Cap delta time to prevent large jumps
		dt = 0.1
	}

	// Apply friction to velocity
	c.velocityX *= c.friction
	c.velocityY *= c.friction

	// Cap velocity
	if c.velocityX > c.maxVelocity {
		c.velocityX = c.maxVelocity
	} else if c.velocityX < -c.maxVelocity {
		c.velocityX = -c.maxVelocity
	}
	if c.velocityY > c.maxVelocity {
		c.velocityY = c.maxVelocity
	} else if c.velocityY < -c.maxVelocity {
		c.velocityY = -c.maxVelocity
	}

	// Convert velocity to mouse movement
	deltaX := int32(c.velocityX * 2.5) // Scale factor for mouse sensitivity
	deltaY := int32(c.velocityY * 2.5)

	// Only move if there's meaningful velocity
	if deltaX != 0 || deltaY != 0 {
		log.Printf("Physics mouse move: vx=%.2f, vy=%.2f, dx=%d, dy=%d", c.velocityX, c.velocityY, deltaX, deltaY)
		err := c.mouse.MoveRelative(deltaX, deltaY)
		if err != nil {
			log.Printf("Physics mouse move error: %v", err)
		}
	}
}

// updates velocity based on device acceleration or rotation depending on control mode
func (c *PacketController) updateMotion(accelX, accelY, accelZ, rotAlpha, rotBeta, rotGamma float64) {
	c.physicsMu.Lock()
	defer c.physicsMu.Unlock()

	if c.controlType == Flat {
		// Table mode: use acceleration for velocity, with deadzone
		// Use accelX for Y (forward/back tilt), accelY for X (left/right tilt)
		if math.Abs(accelY) > c.accelDeadzone {
			c.velocityX += accelY * c.sensitivity
		}
		if math.Abs(accelX) > c.accelDeadzone {
			c.velocityY += accelX * c.sensitivity
		}
		log.Printf("Table mode motion: accel=(%.2f, %.2f, %.2f), velocity=(%.2f, %.2f)", accelX, accelY, accelZ, c.velocityX, c.velocityY)
	} else { // Remote
		// Remote mode: use rotation for velocity, with deadzone
		// Use rotAlpha (yaw) for X movement, rotBeta (pitch) for Y movement
		if math.Abs(rotAlpha) > c.rotDeadzone {
			c.velocityY -= rotAlpha * 0.05 // Reduced sensitivity for handheld mode
		}
		if math.Abs(rotBeta) > c.rotDeadzone {
			c.velocityX -= rotGamma * 0.05 // Reduced sensitivity for handheld mode
		}
		log.Printf("Remote mode motion: rot=(%.2f, %.2f, %.2f), velocity=(%.2f, %.2f)", rotAlpha, rotBeta, rotGamma, c.velocityX, c.velocityY)
	}
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

	case DeviceMotion:
		p := packet.(*DeviceMotionPacket)
		log.Printf("Device motion: accel_x=%.2f, accel_y=%.2f, accel_z=%.2f, rot_alpha=%.2f, rot_beta=%.2f, rot_gamma=%.2f, timestamp=%d", p.AccelX, p.AccelY, p.AccelZ, p.RotAlpha, p.RotBeta, p.RotGamma, p.Timestamp)
		// Update physics state with new acceleration data
		c.updateMotion(p.AccelX, p.AccelY, p.AccelZ, p.RotAlpha, p.RotBeta, p.RotGamma)
		return nil

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
	// Stop physics loop
	if c.isRunning {
		close(c.stopPhysics)
		c.isRunning = false
	}

	return c.mouse.Close()
}
