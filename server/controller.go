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

	// physics state for device motion integration
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

	// calibration baselines
	baselineAccelX   float64
	baselineAccelY   float64
	baselineAccelZ   float64
	baselineRotAlpha float64
	baselineRotBeta  float64
	baselineRotGamma float64

	// calibration accumulators
	sumAccelX        float64
	sumAccelY        float64
	sumAccelZ        float64
	sumRotAlpha      float64
	sumRotBeta       float64
	sumRotGamma      float64
	calibrationCount int
}

// initializes the packet controller with a mouse backend
// detects the display server and sets up the appropriate mouse control system automatically.
func NewPacketController(defaultMode ControlType) (*PacketController, error) {
	mouse, err := NewUniversalMouse()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize mouse: %v", err)
	}

	controller := &PacketController{
		mouse:            mouse,
		controlType:      Flat,
		sensitivity:      3.0,
		friction:         0.98,
		maxVelocity:      150.0,
		accelDeadzone:    0.3,
		rotDeadzone:      0.1,
		stopPhysics:      make(chan struct{}),
		lastUpdate:       time.Now(),
		baselineAccelX:   0.0,
		baselineAccelY:   0.0,
		baselineAccelZ:   0.0,
		baselineRotAlpha: 0.0,
		baselineRotBeta:  0.0,
		baselineRotGamma: 0.0,
		sumAccelX:        0.0,
		sumAccelY:        0.0,
		sumAccelZ:        0.0,
		sumRotAlpha:      0.0,
		sumRotBeta:       0.0,
		sumRotGamma:      0.0,
		calibrationCount: 0,
	}

	controller.startPhysicsLoop()

	return controller, nil
}

// starts the physics integration loop that runs at 60fps
// NOTE: we may wanna test this more later to see how far we can stretch it :)
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

	if dt > 0.1 { // cap delta time to prevent large jumps
		dt = 0.1
	}

	c.velocityX *= c.friction
	c.velocityY *= c.friction

	// snap to zero when velocity is very small (prevents oscillation)
	velocityThreshold := 0.2 // match low velocity threshold for consistency
	if math.Abs(c.velocityX) < velocityThreshold {
		c.velocityX = 0
	}
	if math.Abs(c.velocityY) < velocityThreshold {
		c.velocityY = 0
	}
	if math.Abs(c.velocityY) < velocityThreshold {
		c.velocityY = 0
	}

	// cap velocity
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

	// convert velocity to mouse movement
	deltaX := int32(c.velocityX * 15.0)
	deltaY := int32(c.velocityY * 15.0)

	// only move if there's meaningful velocity
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

	// subtract calibration baselines
	accelX -= c.baselineAccelX
	accelY -= c.baselineAccelY
	accelZ -= c.baselineAccelZ
	rotAlpha -= c.baselineRotAlpha
	rotBeta -= c.baselineRotBeta
	rotGamma -= c.baselineRotGamma

	if c.controlType == Flat {
		// only apply acceleration if:
		//
		//    Velocity is near zero (starting from rest)
		//                           OR
		//    Acceleration is in the same direction as current velocity
		//
		// This prevents deceleration from reversing direction

		// calculate dt for proper time integration
		dt := time.Since(c.lastUpdate).Seconds()
		c.lastUpdate = time.Now()

		// cap dt to prevent large jump
		if dt > 0.1 {
			dt = 0.016
		}

		const lowVelocityThreshold = 1.0
		const highVelocityThreshold = 8.0

		if math.Abs(accelX) > c.accelDeadzone {
			shouldAccelerate := false

			if math.Abs(c.velocityX) < lowVelocityThreshold {
				shouldAccelerate = true
			} else if accelX*c.velocityX > 0 {
				shouldAccelerate = true
			} else if math.Abs(c.velocityX) < highVelocityThreshold {
				shouldAccelerate = true
			}
			if shouldAccelerate {
				c.velocityX += -accelX * c.sensitivity * dt * 50
			}
		}

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
				c.velocityY += accelY * c.sensitivity * dt * 50
			}
		}

		log.Printf("Table mode motion: accel=(%.2f, %.2f, %.2f), velocity=(%.2f, %.2f)", accelX, accelY, accelZ, c.velocityX, c.velocityY)
	} else { // Remote
		// Remote mode: use rotation for velocity, with deadzone
		// Use rotAlpha (yaw) for X movement, rotBeta (pitch) for Y movement
		if math.Abs(rotAlpha) > c.rotDeadzone {
			c.velocityY -= rotAlpha * 0.05
		}
		if math.Abs(rotGamma) > c.rotDeadzone {
			c.velocityX -= rotGamma * 0.05
		}
		log.Printf("Remote mode motion: rot=(%.2f, %.2f, %.2f), velocity=(%.2f, %.2f)", rotAlpha, rotBeta, rotGamma, c.velocityX, c.velocityY)
	}
}

func (c *PacketController) SetControlType(ct ControlType) {
	c.controlType = ct
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

	case Calibration:
		p := packet.(*CalibrationPacket)
		c.sumAccelX += p.AccelX
		c.sumAccelY += p.AccelY
		c.sumAccelZ += p.AccelZ
		c.sumRotAlpha += p.RotAlpha
		c.sumRotBeta += p.RotBeta
		c.sumRotGamma += p.RotGamma
		c.calibrationCount++
		log.Printf("Calibration sample: count=%d, accel=(%.2f, %.2f, %.2f), rot=(%.2f, %.2f, %.2f)", c.calibrationCount, p.AccelX, p.AccelY, p.AccelZ, p.RotAlpha, p.RotBeta, p.RotGamma)
		return nil

	case CalibrationDone:
		if c.calibrationCount > 0 {
			c.baselineAccelX = c.sumAccelX / float64(c.calibrationCount)
			c.baselineAccelY = c.sumAccelY / float64(c.calibrationCount)
			c.baselineAccelZ = c.sumAccelZ / float64(c.calibrationCount)
			c.baselineRotAlpha = c.sumRotAlpha / float64(c.calibrationCount)
			c.baselineRotBeta = c.sumRotBeta / float64(c.calibrationCount)
			c.baselineRotGamma = c.sumRotGamma / float64(c.calibrationCount)
			log.Printf("Calibration done: baselines set from %d samples", c.calibrationCount)
		} else {
			log.Println("Calibration done: no samples collected, baselines remain 0")
		}
		c.sumAccelX = 0.0
		c.sumAccelY = 0.0
		c.sumAccelZ = 0.0
		c.sumRotAlpha = 0.0
		c.sumRotBeta = 0.0
		c.sumRotGamma = 0.0
		c.calibrationCount = 0
		return nil

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
