package server

import (
	"fmt"
	"log"
	"math"
	"os"
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
		sensitivity:   1.2,   // Higher sensitivity for adaptive control
		friction:      0.95,  // Reduced friction for better momentum (5% loss)
		maxVelocity:   150.0, // Higher velocity cap for more speed
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

	// Snap to zero when velocity is very small (prevents oscillation)
	velocityThreshold := 0.2 // Match low velocity threshold for consistency
	if math.Abs(c.velocityX) < velocityThreshold {
		c.velocityX = 0
	}
	if math.Abs(c.velocityY) < velocityThreshold {
		c.velocityY = 0
	}
	if math.Abs(c.velocityY) < velocityThreshold {
		c.velocityY = 0
	}

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
	deltaX := int32(c.velocityX * 6.0) // Further increased for adaptive control
	deltaY := int32(c.velocityY * 6.0)

	// Only move if there's meaningful velocity
	if deltaX != 0 || deltaY != 0 {
		// fmt.Fprintf(os.Stderr, "\033[2K\rPhysics mouse move: vx=%8.2f, vy=%8.2f, dx=%8d, dy=%8d", c.velocityX, c.velocityY, deltaX, deltaY)
		err := c.mouse.MoveRelative(deltaX, deltaY)
		if err != nil {
			log.Printf("Physics mouse move error: %v", err)
		}
	}
}

// updates velocity based on device acceleration or rotation depending on control mode
func (c *PacketController) updateMotion(accelX, accelY, accelZ, rotAlpha, rotBeta, rotGamma, sensitivity float64) {
	c.physicsMu.Lock()
	defer c.physicsMu.Unlock()

	if c.controlType == Flat {
		// Only apply acceleration if:
		// 1. Velocity is near zero (starting from rest), OR
		// 2. Acceleration is in the same direction as current velocity
		// This prevents deceleration from reversing direction

		// Calculate dt for proper time integration
		dt := time.Since(c.lastUpdate).Seconds()
		c.lastUpdate = time.Now()
		if dt > 0.1 { // Cap dt to prevent large jumps
			dt = 0.016
		}

		// Adaptive commitment thresholds for better reactivity
		const lowVelocityThreshold = 0.2  // Allow reversals when slow
		const highVelocityThreshold = 2.0 // Strong commitment when fast

		// Handle X axis (accelX controls X movement - horizontal mouse)
		if math.Abs(accelX) > c.accelDeadzone {
			shouldAccelerate := false

			if math.Abs(c.velocityX) < lowVelocityThreshold {
				// Low velocity: allow any direction change (fully reactive)
				shouldAccelerate = true
			} else if accelX*c.velocityX > 0 {
				// Same direction: always accelerate
				shouldAccelerate = true
			} else if math.Abs(c.velocityX) < highVelocityThreshold {
				// Medium velocity, opposite direction: allow reversal
				shouldAccelerate = true
			}
			// High velocity + opposite direction: maintain commitment (no acceleration)

			if shouldAccelerate {
				c.velocityX += -accelX * sensitivity * dt * 180 // Use client sensitivity for table mode
			}
		}

		// Handle Y axis (accelY controls Y movement - vertical mouse)
		if math.Abs(accelY) > c.accelDeadzone {
			shouldAccelerate := false

			if math.Abs(c.velocityY) < lowVelocityThreshold {
				shouldAccelerate = true
			} else if accelY*c.velocityY > 0 {
				shouldAccelerate = true
			} else if math.Abs(c.velocityY) < highVelocityThreshold {
				shouldAccelerate = true
			}

			if shouldAccelerate {
				c.velocityY += accelY * sensitivity * dt * 180 // Use client sensitivity for table mode
			}
		}

		fmt.Fprintf(os.Stderr, "\033[2K\rTable mode motion: accel_x=%8.2f, accel_y=%8.2f, accel_z=%8.2f, velocity_x=%8.2f, velocity_y=%8.2f, sensitivity=%8.2f", accelX, accelY, accelZ, c.velocityX, c.velocityY, sensitivity)
	} else { // Remote
		// Remote mode: use rotation for velocity, with deadzone
		// Use rotAlpha (yaw) for X movement, rotBeta (pitch) for Y movement
		if math.Abs(rotAlpha) > c.rotDeadzone {
			c.velocityY -= rotAlpha * sensitivity * 0.01 // Apply client sensitivity for handheld mode
		}
		if math.Abs(rotGamma) > c.rotDeadzone {
			c.velocityX -= rotGamma * sensitivity * 0.01 // Apply client sensitivity for handheld mode
		}
		fmt.Fprintf(os.Stderr, "\033[2K\rRemote mode motion: rot_alpha=%8.2f, rot_beta=%8.2f, rot_gamma=%8.2f, velocity_x=%8.2f, velocity_y=%8.2f, sensitivity=%8.2f", rotAlpha, rotBeta, rotGamma, c.velocityX, c.velocityY, sensitivity)
	}
}

func (c *PacketController) SetControlType(ct ControlType) {
	c.controlType = ct

	// Reset velocity when switching modes
	c.physicsMu.Lock()
	c.velocityX = 0
	c.velocityY = 0
	c.physicsMu.Unlock()
}

// takes a deserialized packet and executes the corresponding mouse action
// this is where network commands become actual cursor movements and button presses
func (c *PacketController) ProcessPacket(packet Packet) error {
	switch packet.Type() {
	case MouseMove:
		p := packet.(*MouseMovePacket)
		controlType := c.controlType

		// Apply sensitivity multiplier
		deltaX := int32(float64(p.DeltaX) * p.Sensitivity)
		deltaY := int32(float64(p.DeltaY) * p.Sensitivity)

		// TODO: test both modes to ensure correct mouse movement behavior
		//		 leaving for now so that both will function the same
		switch controlType {
		case Flat:
			log.Printf("Moving mouse (flat): dx=%d, dy=%d (raw: %d, %d, sens: %.2f)", deltaX, deltaY, p.DeltaX, p.DeltaY, p.Sensitivity)
			return c.mouse.MoveRelative(deltaX, deltaY)
		case Remote:
			log.Printf("Moving mouse (remote): dx=%d, dy=%d (raw: %d, %d, sens: %.2f)", deltaX, deltaY, p.DeltaX, p.DeltaY, p.Sensitivity)
			return c.mouse.MoveRelative(deltaX, deltaY)
		default:
			return fmt.Errorf("unknown control type: %d", controlType)
		}

	case DeviceMotion:
		p := packet.(*DeviceMotionPacket)
		fmt.Fprintf(os.Stderr, "\033[2K\rDevice motion: accel_x=%8.2f, accel_y=%8.2f, accel_z=%8.2f, rot_alpha=%8.2f, rot_beta=%8.2f, rot_gamma=%8.2f, timestamp=%13d, sensitivity=%8.2f", p.AccelX, p.AccelY, p.AccelZ, p.RotAlpha, p.RotBeta, p.RotGamma, p.Timestamp, p.Sensitivity)
		// Update physics state with new acceleration data
		c.updateMotion(p.AccelX, p.AccelY, p.AccelZ, p.RotAlpha, p.RotBeta, p.RotGamma, p.Sensitivity)
		return nil

	case ScrollMove:
		p := packet.(*ScrollMovePacket)
		// Apply sensitivity multiplier
		deltaX := int32(float64(p.DeltaX) * p.Sensitivity)
		deltaY := int32(float64(p.DeltaY) * p.Sensitivity)
		log.Printf("Scrolling: delta_x=%d, delta_y=%d (raw: %d, %d, sens: %.2f)", deltaX, deltaY, p.DeltaX, p.DeltaY, p.Sensitivity)
		return c.mouse.Scroll(deltaX, deltaY)

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
