# Cross-Platform Mouse Control Implementation Guide

A language-agnostic guide for implementing mouse control that works across all major platforms.

---

## Overview

To create a cross-platform mouse control tool, you need to:
1. Detect what platform/display server you're running on
2. Use the appropriate commands or libraries for that platform
3. Provide a unified interface regardless of backend

---

## Step 1: Platform Detection

### What to Detect

**Operating System Level:**
- Linux
- Windows
- macOS
- Other Unix-like systems

**Linux Display Server Level:**
- Wayland
- X11

### Detection Strategy

#### For Operating System:
Use your language's built-in OS detection (usually available in standard library)

#### For Linux Display Servers:

**Priority 1: Check `$XDG_SESSION_TYPE` environment variable**
- Value will be `"wayland"` or `"x11"`
- Most reliable method

**Priority 2: Check `$WAYLAND_DISPLAY` environment variable**
- If set, you're on Wayland

**Priority 3: Check `$DISPLAY` environment variable**
- If set, you're on X11

---

## Step 2: Understand Platform-Specific Tools

### Wayland (Linux)

**Tool:** `ydotool`

**Requirements:**
- User must have `ydotool` installed
- `ydotoold` daemon must be running in background
- Commands must run with elevated privileges (sudo) OR user must have proper uinput permissions
- Socket file exists at `/tmp/.ydotool_socket` (default)

**What it can do:**
- Move mouse relatively or absolutely
- Click buttons (left, right, middle)
- Press and hold buttons (for dragging)
- Cannot get current mouse position

**Key commands:**
- Relative movement: `ydotool mousemove -- <dx> <dy>`
- Absolute movement: `ydotool mousemove -a -- <x> <y>`
- Click: `ydotool click <code>`
- Press: `ydotool mousedown <code>`
- Release: `ydotool mouseup <code>`

**Button codes:**
- Click codes: `0xC0` (left), `0xC1` (right), `0xC2` (middle)
- Press/Release codes: `0x40` (left), `0x41` (right), `0x42` (middle)

### X11 (Linux)

**Tool:** `xdotool` (most common)

**Requirements:**
- User must have `xdotool` installed
- No daemon needed
- No special permissions needed
- `$DISPLAY` must be set

**What it can do:**
- Move mouse relatively or absolutely
- Click buttons
- Press and hold buttons
- Get current mouse position
- Much more (window manipulation, keyboard, etc.)

**Key commands:**
- Relative movement: `xdotool mousemove_relative -- <dx> <dy>`
- Absolute movement: `xdotool mousemove <x> <y>`
- Click: `xdotool click <button>`
- Press: `xdotool mousedown <button>`
- Release: `xdotool mouseup <button>`
- Get position: `xdotool getmouselocation`

**Button numbers:**
- `1` = left, `3` = right, `2` = middle

### Windows

**Options:**
1. Use Windows API directly (SendInput, mouse_event)
2. Use a cross-platform library that abstracts the API

**Requirements:**
- No external tools needed (APIs are built-in)
- May need to run as administrator for some applications
- Easier to use libraries than raw API calls

**What it can do:**
- Full mouse control
- Get mouse position
- Multiple monitors supported

### macOS

**Options:**
1. Use CoreGraphics framework (CGEvent APIs)
2. Use a cross-platform library

**Requirements:**
- No external tools needed
- Must grant Accessibility permissions to your application
- User will be prompted on first run

**What it can do:**
- Full mouse control
- Get mouse position
- Multiple monitors supported

---

## Step 3: Implementation Strategy

### Architecture

```
Your Application
    ↓
Platform Detector
    ↓
┌──────────┬───────────┬──────────┬─────────┐
│ Wayland  │    X11    │ Windows  │  macOS  │
│ Backend  │  Backend  │ Backend  │ Backend │
└──────────┴───────────┴──────────┴─────────┘
```

### Core Functions to Implement

**Essential:**
1. `detect_platform()` - Returns what platform/display server you're on
2. `move_relative(dx, dy)` - Move mouse by offset
3. `move_to(x, y)` - Move mouse to absolute position
4. `click(button)` - Click a mouse button
5. `press(button)` - Press and hold a button
6. `release(button)` - Release a button

**Nice to have:**
7. `get_position()` - Get current mouse position (not available on Wayland)
8. `drag(x1, y1, x2, y2)` - Higher-level drag operation
9. `scroll(dx, dy)` - Scroll wheel

### Implementation Approaches

**Approach 1: Execute Shell Commands**
- Call `ydotool`, `xdotool`, etc. as external processes
- Simplest to implement
- Works in any language
- Slightly slower (process spawning overhead)
- Requires tools to be installed

**Approach 2: Use Cross-Platform Libraries**
- Use libraries like `enigo` (Rust), `robotgo` (Go), `pynput` (Python)
- Libraries handle platform differences
- Usually faster than shell commands
- May have better error handling
- Compiles into single binary (no external dependencies)

**Approach 3: Use Native APIs Directly**
- Call Windows API, CoreGraphics, X11 libraries directly
- Most control and performance
- Most complex to implement
- Requires FFI (Foreign Function Interface) in most languages

---

## Step 4: Handle Platform Differences

### Key Differences to Account For

**Coordinate Systems:**
- Some systems have origin (0,0) at top-left
- Multi-monitor setups may have negative coordinates
- Wayland doesn't support absolute positioning in all compositors

**Permissions:**
- Wayland requires elevated permissions or uinput access
- macOS requires Accessibility permissions
- Windows may need admin for certain apps

**Missing Features:**
- Wayland cannot get current mouse position via ydotool
- Some platforms don't support all button types

**Error Handling:**
- External commands may fail if tools aren't installed
- Daemons may not be running (ydotoold)
- Permissions may be denied

### Graceful Degradation

1. Check if required tools are installed before running
2. Provide helpful error messages (e.g., "Install ydotool with: sudo pacman -S ydotool")
3. Offer alternative methods if primary method fails
4. Document platform-specific requirements in README

---

## Step 5: Distribution Considerations

### Dependencies to Document

**Linux (Wayland):**
- Requires: `ydotool` package
- Setup: Must run `ydotoold` daemon
- Permissions: May need sudo or uinput group membership

**Linux (X11):**
- Requires: `xdotool` package (usually pre-installed)
- Setup: None
- Permissions: None

**Windows:**
- Requires: Nothing (if using native APIs or bundled libraries)
- Setup: None
- Permissions: May need admin for some apps

**macOS:**
- Requires: Nothing
- Setup: Grant Accessibility permissions when prompted
- Permissions: User must approve in System Preferences

### Installation Instructions Template

Create a README that includes:

1. **Quick Start** - How to run immediately on most common platform
2. **Platform-Specific Setup** - Separate sections for each platform
3. **Troubleshooting** - Common issues and solutions
4. **Pre-built Binaries** - Where to download for each platform
5. **Building from Source** - How to compile for each platform

### Testing Checklist

Test on:
- [ ] Ubuntu/Debian with Wayland
- [ ] Ubuntu/Debian with X11
- [ ] Arch Linux with Wayland
- [ ] Fedora with Wayland
- [ ] Windows 10/11
- [ ] macOS (latest version)
- [ ] Multi-monitor setups

---

## Quick Reference: Command Comparison

| Action | Wayland (ydotool) | X11 (xdotool) |
|--------|-------------------|---------------|
| Move relative | `ydotool mousemove -- 100 50` | `xdotool mousemove_relative -- 100 50` |
| Move absolute | `ydotool mousemove -a -- 500 300` | `xdotool mousemove 500 300` |
| Left click | `ydotool click 0xC0` | `xdotool click 1` |
| Right click | `ydotool click 0xC1` | `xdotool click 3` |
| Press left | `ydotool mousedown 0x40` | `xdotool mousedown 1` |
| Release left | `ydotool mouseup 0x40` | `xdotool mouseup 1` |

---

## Common Pitfalls

1. **Forgetting to start ydotoold daemon** - Most common Wayland issue
2. **Not handling missing tools** - Check if xdotool/ydotool exists before calling
3. **Permission issues** - Wayland often needs sudo, remember to document this
4. **Assuming position tracking works** - Wayland doesn't support getting mouse position
5. **Hardcoding socket paths** - Use environment variables or defaults
6. **Not testing on real hardware** - VMs may behave differently
7. **Forgetting multi-monitor support** - Coordinates can be negative or very large

---

## Next Steps

1. Choose your implementation language
2. Decide on approach (shell commands vs libraries)
3. Implement platform detection first
4. Implement one platform fully before adding others
5. Test thoroughly on each target platform
6. Write comprehensive installation docs
