package main

import (
	"bufio"
	"bytes"
	"fmt"
	"math"
	"os"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/mdp/qrterminal/v3"
	"golang.org/x/term"
	"mouse-control/backends"
)

func stripANSI(s string) string {
	return regexp.MustCompile(`\x1b\[[0-9;]*m`).ReplaceAllString(s, "")
}

func runDemo() {
	mouse, err := backends.NewUniversalMouse()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer mouse.Close()

	fmt.Println("Starting demo in 3 seconds...")
	time.Sleep(3 * time.Second)

	// Get starting position
	startX, startY, err := mouse.GetPosition()
	if err == nil {
		fmt.Printf("Starting position: (%d, %d)\n", startX, startY)
	}

	// Test 1: Basic movements
	fmt.Println("\n1. Moving in square (200px)...")
	squareMoves := []struct{ dx, dy int32 }{
		{200, 0}, {0, 200}, {-200, 0}, {0, -200},
	}
	for _, move := range squareMoves {
		mouse.MoveRelative(move.dx, move.dy)
		time.Sleep(500 * time.Millisecond)
	}

	// Test 2: Circle
	fmt.Println("\n2. Drawing circle...")
	radius := 100.0
	points := 36
	for i := 0; i < points+1; i++ {
		angle := float64(i) / float64(points) * 2 * math.Pi
		if i > 0 {
			prevAngle := float64(i-1) / float64(points) * 2 * math.Pi
			dx := radius * (math.Cos(angle) - math.Cos(prevAngle))
			dy := radius * (math.Sin(angle) - math.Sin(prevAngle))
			mouse.MoveRelative(int32(dx), int32(dy))
			time.Sleep(50 * time.Millisecond)
		}
	}

	time.Sleep(500 * time.Millisecond)

	// Test 3: Click
	fmt.Println("\n3. Left click...")
	mouse.Click("left")
	time.Sleep(500 * time.Millisecond)

	// Test 4: Double click
	fmt.Println("\n4. Double click...")
	mouse.Click("left")
	time.Sleep(100 * time.Millisecond)
	mouse.Click("left")
	time.Sleep(500 * time.Millisecond)

	// Test 5: Drag
	fmt.Println("\n5. Dragging...")
	mouse.Drag(100, 100, 1*time.Second)
	time.Sleep(500 * time.Millisecond)

	// Return to start
	if err == nil {
		fmt.Printf("\n6. Returning to start position (%d, %d)...\n", startX, startY)
		mouse.MoveTo(startX, startY)
	}

	fmt.Println("\nDemo complete!")
}

func interactiveMode() {
	mouse, err := backends.NewUniversalMouse()
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}
	defer mouse.Close()

	fmt.Println("\n=== Universal Mouse Control ===")
	fmt.Println("Commands:")
	fmt.Println("  move DX DY     - Move relative")
	fmt.Println("  abs X Y        - Move to absolute position")
	fmt.Println("  click [button] - Click (left/right/middle)")
	fmt.Println("  pos            - Show position")
	fmt.Println("  drag DX DY     - Drag relative")
	fmt.Println("  demo           - Run demo")
	fmt.Println("  info           - Show system info")
	fmt.Println("  qr             - Print QR code")
	fmt.Println("  quit           - Exit")
	fmt.Println()

	scanner := bufio.NewScanner(os.Stdin)
	for {
		fmt.Print("> ")
		if !scanner.Scan() {
			break
		}

		cmd := strings.Fields(strings.TrimSpace(scanner.Text()))
		if len(cmd) == 0 {
			continue
		}

		action := strings.ToLower(cmd[0])

		switch action {
		case "quit":
			return
		case "info":
			displayType := backends.DetectDisplayServer()
			fmt.Printf("Display server: %s\n", displayType)
		case "pos":
			x, y, err := mouse.GetPosition()
			if err != nil {
				fmt.Println("Position not available on this backend")
			} else {
				fmt.Printf("Position: (%d, %d)\n", x, y)
			}
		case "move":
			if len(cmd) >= 3 {
				dx, err1 := strconv.Atoi(cmd[1])
				dy, err2 := strconv.Atoi(cmd[2])
				if err1 == nil && err2 == nil {
					mouse.MoveRelative(int32(dx), int32(dy))
					fmt.Printf("Moved by (%d, %d)\n", dx, dy)
				} else {
					fmt.Println("Invalid arguments")
				}
			} else {
				fmt.Println("Usage: move DX DY")
			}
		case "abs":
			if len(cmd) >= 3 {
				x, err1 := strconv.Atoi(cmd[1])
				y, err2 := strconv.Atoi(cmd[2])
				if err1 == nil && err2 == nil {
					mouse.MoveTo(x, y)
					fmt.Printf("Moved to (%d, %d)\n", x, y)
				} else {
					fmt.Println("Invalid arguments")
				}
			} else {
				fmt.Println("Usage: abs X Y")
			}
		case "click":
			button := "left"
			if len(cmd) > 1 {
				button = cmd[1]
			}
			mouse.Click(button)
			fmt.Printf("Clicked %s\n", button)
		case "drag":
			if len(cmd) >= 3 {
				dx, err1 := strconv.Atoi(cmd[1])
				dy, err2 := strconv.Atoi(cmd[2])
				if err1 == nil && err2 == nil {
					mouse.Drag(int32(dx), int32(dy), 1*time.Second)
					fmt.Printf("Dragged (%d, %d)\n", dx, dy)
				} else {
					fmt.Println("Invalid arguments")
				}
			} else {
				fmt.Println("Usage: drag DX DY")
			}
		case "demo":
			runDemo()
		case "qr":
			var buf bytes.Buffer
			config := qrterminal.Config{
				Level:     qrterminal.L,
				Writer:    &buf,
				BlackChar: "\033[37m█\033[0m",
				WhiteChar: " ",
			}
			qrterminal.GenerateWithConfig("https://example.com", config)
			output := buf.String()
			lines := strings.Split(strings.TrimSuffix(output, "\n"), "\n")
			maxWidth := 0
			for _, line := range lines {
				visualLen := len(stripANSI(line))
				if visualLen > maxWidth {
					maxWidth = visualLen
				}
			}
			width, _, err := term.GetSize(0)
			if err != nil || width < maxWidth {
				width = maxWidth
			}
			for _, line := range lines {
				visualLen := len(stripANSI(line))
				padding := (width - visualLen) / 2
				if padding > 0 {
					fmt.Print(strings.Repeat(" ", padding))
				}
				fmt.Println(line)
			}
		default:
			fmt.Println("Invalid command")
		}
	}
}

func main() {
	fmt.Println("Universal Mouse Control in Go")
	fmt.Println("============================")

	if len(os.Args) > 1 && os.Args[1] == "--demo" {
		runDemo()
	} else {
		interactiveMode()
	}
}
