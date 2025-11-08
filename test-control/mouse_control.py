#!/usr/bin/env python3
"""
Universal mouse control that works on:
- Linux Wayland (using uinput)
- Linux X11 (using pynput)
- Windows (using pynput)
- macOS (using pynput)
"""

import os
import sys
import platform
import time
import math


def detect_display_server():
    """
    Detect which display server/OS we're running on.
    Returns: 'wayland', 'x11', 'windows', 'macos', or 'unknown'
    """
    system = platform.system()

    if system == 'Linux':
        # Check XDG_SESSION_TYPE environment variable
        session_type = os.environ.get('XDG_SESSION_TYPE', '').lower()

        if session_type == 'wayland':
            return 'wayland'
        elif session_type == 'x11':
            return 'x11'

        # Fallback: check for WAYLAND_DISPLAY
        if os.environ.get('WAYLAND_DISPLAY'):
            return 'wayland'

        # Fallback: check for DISPLAY (X11)
        if os.environ.get('DISPLAY'):
            return 'x11'

        return 'unknown'

    elif system == 'Windows':
        return 'windows'

    elif system == 'Darwin':  # macOS
        return 'macos'

    return 'unknown'


class WaylandMouse:
    """Mouse control using uinput for Wayland"""

    def __init__(self):
        try:
            import uinput
            self.uinput = uinput
            self.device = self.uinput.Device([
                self.uinput.BTN_LEFT, self.uinput.BTN_RIGHT, self.uinput.BTN_MIDDLE,
                self.uinput.REL_X, self.uinput.REL_Y
            ])
        except ImportError:
            raise RuntimeError(
                "python-uinput not found! Install: pip install python-uinput")
        except Exception as e:
            raise RuntimeError(f"Failed to create uinput device: {e}\n"
                               "Make sure you have permissions. Run:\n"
                               "  sudo modprobe uinput\n"
                               "  sudo usermod -aG input $USER\n"
                               "Then log out and back in.")

    def move_relative(self, dx, dy):
        self.device.emit(self.uinput.REL_X, int(round(dx)))
        self.device.emit(self.uinput.REL_Y, int(round(dy)))
        self.device.syn()

    def move_to(self, x, y):
        # uinput supports absolute with ABS_X, but need screen size
        # For now, not implemented; use relative movement instead
        print("Warning: Absolute positioning not supported with uinput backend")

    def click(self, button='left'):
        btn_map = {
            'left': self.uinput.BTN_LEFT,
            'right': self.uinput.BTN_RIGHT,
            'middle': self.uinput.BTN_MIDDLE
        }
        btn = btn_map.get(button, self.uinput.BTN_LEFT)
        self.device.emit(btn, 1)
        self.device.syn()
        time.sleep(0.01)
        self.device.emit(btn, 0)
        self.device.syn()

    def press(self, button='left'):
        btn_map = {
            'left': self.uinput.BTN_LEFT,
            'right': self.uinput.BTN_RIGHT,
            'middle': self.uinput.BTN_MIDDLE
        }
        btn = btn_map.get(button, self.uinput.BTN_LEFT)
        self.device.emit(btn, 1)
        self.device.syn()

    def release(self, button='left'):
        btn_map = {
            'left': self.uinput.BTN_LEFT,
            'right': self.uinput.BTN_RIGHT,
            'middle': self.uinput.BTN_MIDDLE
        }
        btn = btn_map.get(button, self.uinput.BTN_LEFT)
        self.device.emit(btn, 0)
        self.device.syn()

    def get_position(self):
        return None


class PynputMouse:
    """Mouse control using pynput for X11/Windows/macOS"""

    def __init__(self):
        try:
            from pynput.mouse import Controller, Button
            self.mouse = Controller()
            self.Button = Button
        except ImportError:
            raise RuntimeError("pynput not found! Install: pip install pynput")

    def move_relative(self, dx, dy):
        x, y = self.mouse.position
        self.mouse.position = (x + int(dx), y + int(dy))

    def move_to(self, x, y):
        self.mouse.position = (int(x), int(y))

    def click(self, button='left'):
        btn = getattr(self.Button, button)
        self.mouse.click(btn)

    def press(self, button='left'):
        btn = getattr(self.Button, button)
        self.mouse.press(btn)

    def release(self, button='left'):
        btn = getattr(self.Button, button)
        self.mouse.release(btn)

    def get_position(self):
        return self.mouse.position


class UniversalMouse:
    """
    Universal mouse controller that automatically uses the right backend.
    """

    def __init__(self):
        self.display_type = detect_display_server()
        print(f"Detected: {self.display_type}")

        if self.display_type == 'wayland':
            print("Using uinput backend")
            self.backend = WaylandMouse()
        elif self.display_type in ['x11', 'windows', 'macos']:
            print("Using pynput backend")
            self.backend = PynputMouse()
        else:
            raise RuntimeError(f"Unsupported display server: {
                               self.display_type}")

    def move_relative(self, dx, dy):
        """Move mouse by relative amount"""
        self.backend.move_relative(dx, dy)

    def move_to(self, x, y):
        """Move mouse to absolute position"""
        self.backend.move_to(x, y)

    def click(self, button='left'):
        """Click mouse button (left/right/middle)"""
        self.backend.click(button)

    def press(self, button='left'):
        """Press and hold button"""
        self.backend.press(button)

    def release(self, button='left'):
        """Release button"""
        self.backend.release(button)

    def get_position(self):
        """Get current mouse position (may return None on Wayland)"""
        return self.backend.get_position()

    def drag(self, dx, dy, duration=0.5):
        """Drag mouse while holding left button"""
        self.press('left')
        time.sleep(0.1)

        steps = 20
        for i in range(steps):
            # Calculate incremental movement to avoid rounding errors
            next_x = int(dx * (i + 1) / steps)
            next_y = int(dy * (i + 1) / steps)
            prev_x = int(dx * i / steps)
            prev_y = int(dy * i / steps)

            step_x = next_x - prev_x
            step_y = next_y - prev_y

            self.move_relative(step_x, step_y)
            time.sleep(duration / steps)

        self.release('left')


def demo():
    """Demo the universal mouse controller"""
    mouse = UniversalMouse()

    print("\n" + "="*50)
    print("STARTING DEMO IN 3 SECONDS")
    print("="*50)
    time.sleep(3)

    # Get starting position (if available)
    start_pos = mouse.get_position()
    if start_pos:
        print(f"Starting position: {start_pos}")

    # Test 1: Basic movements
    print("\n1. Moving in square (200px)...")
    for dx, dy in [(200, 0), (0, 200), (-200, 0), (0, -200)]:
        mouse.move_relative(dx, dy)
        time.sleep(0.5)

    # Test 2: Circle
    print("\n2. Drawing circle...")
    radius = 100
    points = 36
    for i in range(points + 1):
        angle = (i / points) * 2 * math.pi
        if i > 0:
            prev_angle = ((i-1) / points) * 2 * math.pi
            dx = radius * (math.cos(angle) - math.cos(prev_angle))
            dy = radius * (math.sin(angle) - math.sin(prev_angle))
            mouse.move_relative(dx, dy)
            time.sleep(0.05)

    time.sleep(0.5)

    # Test 3: Click
    print("\n3. Left click...")
    mouse.click('left')
    time.sleep(0.5)

    # Test 4: Double click
    print("\n4. Double click...")
    mouse.click('left')
    time.sleep(0.1)
    mouse.click('left')
    time.sleep(0.5)

    # Test 5: Drag
    print("\n5. Dragging...")
    mouse.drag(100, 100, duration=1.0)
    time.sleep(0.5)

    # Return to start if we know where it is
    if start_pos:
        print(f"\n6. Returning to start position {start_pos}...")
        mouse.move_to(*start_pos)

    print("\n" + "="*50)
    print("DEMO COMPLETE!")
    print("="*50)


def interactive_mode():
    """Interactive mode for testing"""
    mouse = UniversalMouse()

    print("\n=== Universal Mouse Control ===")
    print("Commands:")
    print("  move DX DY     - Move relative")
    print("  abs X Y        - Move to absolute position")
    print("  click [button] - Click (left/right/middle)")
    print("  pos            - Show position")
    print("  drag DX DY     - Drag relative")
    print("  demo           - Run demo")
    print("  info           - Show system info")
    print("  quit           - Exit")
    print()

    while True:
        try:
            cmd = input("> ").strip().split()
            if not cmd:
                continue

            action = cmd[0].lower()

            if action == 'quit':
                break
            elif action == 'info':
                print(f"Display server: {mouse.display_type}")
                print(f"Backend: {type(mouse.backend).__name__}")
            elif action == 'pos':
                pos = mouse.get_position()
                if pos:
                    print(f"Position: {pos}")
                else:
                    print("Position not available on this backend")
            elif action == 'move' and len(cmd) >= 3:
                mouse.move_relative(int(cmd[1]), int(cmd[2]))
                print(f"Moved by ({cmd[1]}, {cmd[2]})")
            elif action == 'abs' and len(cmd) >= 3:
                mouse.move_to(int(cmd[1]), int(cmd[2]))
                print(f"Moved to ({cmd[1]}, {cmd[2]})")
            elif action == 'click':
                button = cmd[1] if len(cmd) > 1 else 'left'
                mouse.click(button)
                print(f"Clicked {button}")
            elif action == 'drag' and len(cmd) >= 3:
                mouse.drag(int(cmd[1]), int(cmd[2]))
                print(f"Dragged ({cmd[1]}, {cmd[2]})")
            elif action == 'demo':
                demo()
            else:
                print("Invalid command")
        except KeyboardInterrupt:
            print("\nExiting...")
            break
        except Exception as e:
            print(f"Error: {e}")


if __name__ == "__main__":
    print("Universal Mouse Control")
    print("=" * 40)

    if len(sys.argv) > 1 and sys.argv[1] == '--demo':
        demo()
    else:
        interactive_mode()
