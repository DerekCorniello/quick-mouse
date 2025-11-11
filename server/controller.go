package server

import (
	"fmt"
	"log"
	"math"
	"sync"
	"time"
)

func (c *PacketController) logIfEnabled(format string, args ...any) {
	if c.verbose {
		log.Printf(format, args...)
	}
}

// takes incoming packets from the websocket and translates them
// into actual mouse stuff it acts as the bridge between network messages and system input.
type PacketController struct {
	mouse *UniversalMouse

	// physics state for device motion integration
	physicsMu   sync.RWMutex
	velocityX   float64
	velocityY   float64
	lastUpdate  time.Time
	sensitivity float64
	friction    float64
	maxVelocity float64
	rotDeadzone float64
	isRunning   bool
	stopPhysics chan struct{}

	// calibration baselines
	baselineRotAlpha float64
	baselineRotBeta  float64
	baselineRotGamma float64

	// calibration accumulators
	sumRotAlpha      float64
	sumRotBeta       float64
	sumRotGamma      float64
	calibrationCount int

	calibrationStarted bool

	verbose bool
}

// initializes the packet controller with a mouse backend
// detects the display server and sets up the appropriate mouse control system automatically.
func NewPacketController(verbose bool) (*PacketController, error) {
	mouse, err := NewUniversalMouse()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize mouse: %v", err)
	}

	controller := &PacketController{
		mouse:              mouse,
		sensitivity:        3.0,
		friction:           0.9,
		maxVelocity:        150.0,
		rotDeadzone:        2.0,
		stopPhysics:        make(chan struct{}),
		lastUpdate:         time.Now(),
		baselineRotAlpha:   0.0,
		baselineRotBeta:    0.0,
		baselineRotGamma:   0.0,
		sumRotAlpha:        0.0,
		sumRotBeta:         0.0,
		sumRotGamma:        0.0,
		calibrationCount:   0,
		calibrationStarted: false,
		verbose:            verbose,
	}

	controller.startPhysicsLoop()

	return controller, nil
}

// starts the physics integration loop that runs at 60fps
// NOTE: we may wanna test this more later to see how far we can stretch it :)
func (c *PacketController) startPhysicsLoop() {
	c.isRunning = true
	c.logIfEnabled("Starting physics loop")
	go func() {
		ticker := time.NewTicker(16 * time.Millisecond) // ~60fps
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				c.updatePhysics()
			case <-c.stopPhysics:
				c.logIfEnabled("Stopping physics loop")
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
	velocityThreshold := 0.01 // match low velocity threshold for consistency
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
		err := c.mouse.MoveRelative(deltaX, deltaY)
		if err != nil {
			c.logIfEnabled("Physics mouse move error: %v", err)
		}
	}
}

// normalizes angle difference to -180 to 180 degrees to handle wrapping
func normalizeAngleDiff(diff float64) float64 {
	for diff > 180 {
		diff -= 360
	}
	for diff < -180 {
		diff += 360
	}
	return diff
}

// updates velocity based on device rotation
func (c *PacketController) updateMotion(rotAlpha, rotBeta, rotGamma float64) {
	c.physicsMu.Lock()
	defer c.physicsMu.Unlock()

	// subtract calibration baselines
	rotAlpha -= c.baselineRotAlpha
	rotBeta -= c.baselineRotBeta
	rotGamma -= c.baselineRotGamma

	// normalize to handle angle wrapping
	rotAlpha = normalizeAngleDiff(rotAlpha)
	rotBeta = normalizeAngleDiff(rotBeta)
	rotGamma = normalizeAngleDiff(rotGamma)

	// use rotBeta (pitch) for Y movement, rotGamma (roll) for X movement
	// centering force (always applied, weak)
	c.velocityY -= rotBeta * 0.0005
	c.velocityX += rotGamma * 0.0005
	// movement force (only above deadzone)
	if math.Abs(rotBeta) > c.rotDeadzone {
		c.velocityY -= rotBeta * 0.01
	}
	if math.Abs(rotGamma) > c.rotDeadzone {
		c.velocityX += rotGamma * 0.01
	}
}

// takes a deserialized packet and executes the corresponding mouse action
// this is where network commands become actual cursor movements and button presses
func (c *PacketController) ProcessPacket(packet Packet) error {
	switch packet.Type() {
	case MouseMove:
		p := packet.(*MouseMovePacket)
		sensitivity := p.PointerSensitivity / 25.0
		scaledDeltaX := int32(float64(p.DeltaX) * sensitivity)
		scaledDeltaY := int32(float64(p.DeltaY) * sensitivity)
		return c.mouse.MoveRelative(scaledDeltaX, scaledDeltaY)

	case DeviceMotion:
		p := packet.(*DeviceMotionPacket)
		sensitivity := p.PointerSensitivity / 25.0
		scaledRotAlpha := p.RotAlpha * sensitivity
		scaledRotBeta := p.RotBeta * sensitivity
		scaledRotGamma := p.RotGamma * sensitivity
		c.updateMotion(scaledRotAlpha, scaledRotBeta, scaledRotGamma)
		return nil

	case ScrollMove:
		p := packet.(*ScrollMovePacket)
		sensitivity := p.ScrollSensitivity / 50.0
		scaledDeltaX := int32(p.DeltaX * sensitivity)
		scaledDeltaY := int32(p.DeltaY * sensitivity)
		return c.mouse.Scroll(scaledDeltaX, scaledDeltaY)

	case LeftClickUp:
		c.logIfEnabled("Left click up")
		return c.mouse.Release("left")

	case LeftClickDown:
		c.logIfEnabled("Left click down")
		return c.mouse.Press("left")

	case RightClickUp:
		c.logIfEnabled("Right click up")
		return c.mouse.Release("right")

	case RightClickDown:
		c.logIfEnabled("Right click down")
		return c.mouse.Press("right")

	case Calibration:
		p := packet.(*CalibrationPacket)
		if !c.calibrationStarted {
			c.centerMouseForCalibration()
			c.calibrationStarted = true
		}
		c.sumRotAlpha += p.RotAlpha
		c.sumRotBeta += p.RotBeta
		c.sumRotGamma += p.RotGamma
		c.calibrationCount++
		c.logIfEnabled("Calibration sample: count=%d, rot=(%.5f, %.5f, %.5f)", c.calibrationCount, p.RotAlpha, p.RotBeta, p.RotGamma)
		return nil

	case CalibrationDone:
		if c.calibrationCount > 0 {
			c.baselineRotAlpha = c.sumRotAlpha / float64(c.calibrationCount)
			c.baselineRotBeta = c.sumRotBeta / float64(c.calibrationCount)
			c.baselineRotGamma = c.sumRotGamma / float64(c.calibrationCount)
			c.logIfEnabled("Calibration done: baselines set from %d samples", c.calibrationCount)
		} else {
			c.logIfEnabled("Calibration done: no samples collected, baselines remain 0")
		}
		c.sumRotAlpha = 0.0
		c.sumRotBeta = 0.0
		c.sumRotGamma = 0.0
		c.calibrationCount = 0
		c.calibrationStarted = false
		return nil

	default:
		return fmt.Errorf("unknown packet type: %s", packet.Type())
	}
}

func (c *PacketController) centerMouseForCalibration() {
	err := c.mouse.CenterOnMainDisplay()
	if err != nil {
		c.logIfEnabled("Failed to center mouse for calibration: %v", err)
	} else {
		c.logIfEnabled("Centered mouse on main display for calibration")
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
