import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MouseButtons } from "./components/MouseButtons";
import { Touchpad } from "./components/Touchpad";
import { SensorLog } from "./components/SensorLog";
import { PermissionPrompt } from "./components/PermissionPrompt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";

export default function App() {
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [pointerSensitivity, setPointerSensitivity] = useState(5);
  const [scrollSensitivity, setScrollSensitivity] = useState(5);
  const pointerSensitivityRef = useRef(5);
  const scrollSensitivityRef = useRef(5);

  // Keep refs in sync with state
  useEffect(() => {
    pointerSensitivityRef.current = pointerSensitivity;
  }, [pointerSensitivity]);

  useEffect(() => {
    scrollSensitivityRef.current = scrollSensitivity;
  }, [scrollSensitivity]);
  const [showSensorLog, setShowSensorLog] = useState(false);
  const [buttonsAboveTouchpad, setButtonsAboveTouchpad] = useState(true);
  const [isTable, setIsTable] = useState(true);
  const [naturalScroll, setNaturalScroll] = useState(false);
  const [swapLeftRightClick, setSwapLeftRightClick] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string>("None");
  const [swipeMagnitude, setSwipeMagnitude] = useState<number>(0);
  const isPausedRef = useRef(false);

  const handlePause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
  }, []);
  const initialTouchesRef = useRef<{id: number, x: number, y: number}[]>([]);
  const touchpadRef = useRef<HTMLDivElement>(null);

  // Sensor permission state
  const [permissionState, setPermissionState] = useState<
    "checking" | "prompt" | "requesting" | "granted" | "denied"
  >("checking");
  const PERMISSION_STORAGE_KEY = "device-motion-permission";

  // WebSocket connection state
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected" | "error"
  >("disconnected");
  const [lastMessageTime, setLastMessageTime] = useState(Date.now());
  const [authKey, setAuthKey] = useState<string>("");
  const isMountedRef = useRef(true);

  type Packet = {
    type: string;
    [key: string]: unknown;
  };

  // WebSocket connection management
  const connectWebSocket = useCallback((key: string) => {
    setConnectionStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      if (isMountedRef.current) {
        setConnectionStatus("connected");
        // Send auth packet immediately
        const authPacket = { type: "auth", key };
        websocket.send(JSON.stringify(authPacket));
      }
    };

    websocket.onmessage = (event) => {
      if (isMountedRef.current) {
        setLastMessageTime(Date.now());
        try {
          const data = JSON.parse(event.data);
          if (data.type === "keep_alive") {
            // Keep-alive from server, connection is healthy
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
        }
      }
    };

    websocket.onclose = () => {
      if (isMountedRef.current) {
        setConnectionStatus("disconnected");
        // Attempt to reconnect after a delay if component is still mounted
        setTimeout(() => {
          if (isMountedRef.current) {
            connectWebSocket(key);
          }
        }, 3000);
      }
    };

    websocket.onerror = (error) => {
      if (isMountedRef.current) {
        console.error("WebSocket error:", error);
        setConnectionStatus("error");
      }
    };

    setWs(websocket);
  }, []);

  const sendPacket = useCallback(
    (packet: Packet) => {
      if (isPausedRef.current) {
        return;
      }
      if (ws && ws.readyState === WebSocket.OPEN) {
        try {
          // Validate packet data before sending
          if (!packet.type) {
            console.error("Invalid packet: missing type");
            return;
          }

          // Ensure numeric values are valid
          if (
            packet.x !== undefined &&
            (typeof packet.x !== "number" ||
              !Number.isFinite(packet.x) ||
              isNaN(packet.x))
          ) {
            console.error("Invalid packet x value:", packet.x);
            return;
          }
          if (
            packet.y !== undefined &&
            (typeof packet.y !== "number" ||
              !Number.isFinite(packet.y) ||
              isNaN(packet.y))
          ) {
            console.error("Invalid packet y value:", packet.y);
            return;
          }
          if (
            packet.accel_x !== undefined &&
            (typeof packet.accel_x !== "number" ||
              !Number.isFinite(packet.accel_x) ||
              isNaN(packet.accel_x))
          ) {
            console.error("Invalid packet accel_x value:", packet.accel_x);
            return;
          }
          if (
            packet.accel_y !== undefined &&
            (typeof packet.accel_y !== "number" ||
              !Number.isFinite(packet.accel_y) ||
              isNaN(packet.accel_y))
          ) {
            console.error("Invalid packet accel_y value:", packet.accel_y);
            return;
          }
          if (
            packet.accel_z !== undefined &&
            (typeof packet.accel_z !== "number" ||
              !Number.isFinite(packet.accel_z) ||
              isNaN(packet.accel_z))
          ) {
            console.error("Invalid packet accel_z value:", packet.accel_z);
            return;
          }
          if (
            packet.rot_alpha !== undefined &&
            (typeof packet.rot_alpha !== "number" ||
              !Number.isFinite(packet.rot_alpha) ||
              isNaN(packet.rot_alpha))
          ) {
            console.error("Invalid packet rot_alpha value:", packet.rot_alpha);
            return;
          }
          if (
            packet.rot_beta !== undefined &&
            (typeof packet.rot_beta !== "number" ||
              !Number.isFinite(packet.rot_beta) ||
              isNaN(packet.rot_beta))
          ) {
            console.error("Invalid packet rot_beta value:", packet.rot_beta);
            return;
          }
          if (
            packet.rot_gamma !== undefined &&
            (typeof packet.rot_gamma !== "number" ||
              !Number.isFinite(packet.rot_gamma) ||
              isNaN(packet.rot_gamma))
          ) {
            console.error("Invalid packet rot_gamma value:", packet.rot_gamma);
            return;
          }
          if (
            packet.sensitivity !== undefined &&
            (typeof packet.sensitivity !== "number" ||
              !Number.isFinite(packet.sensitivity) ||
              isNaN(packet.sensitivity) ||
              packet.sensitivity < 0)
          ) {
            console.error("Invalid packet sensitivity value:", packet.sensitivity);
            return;
          }

          const message = JSON.stringify(packet);
          ws.send(message);
        } catch (error) {
          console.error("Failed to send packet:", error);
          setConnectionStatus("error");

          // Attempt reconnection after failed send
          setTimeout(() => {
            if (authKey && isMountedRef.current) {
              connectWebSocket(authKey);
            }
          }, 2000);
        }
      } else {
        console.warn("WebSocket not ready, packet not sent:", packet);
      }
    },
    [ws, authKey, connectWebSocket],
  );

  // Device motion handlers
  const handleDeviceMotion = useCallback(
    (event: DeviceMotionEvent) => {
      if (permissionState !== "granted") {
        console.log("Device motion event received but permissions not granted");
        return;
      }

      const acceleration = event.acceleration;
      const movement = event.rotationRate;
      if (!acceleration) {
        console.log("No acceleration data in device motion event");
        return;
      }

      // Get raw acceleration data
      const accelX = Number(acceleration.x) || 0;
      const accelY = Number(acceleration.y) || 0;
      const accelZ = Number(acceleration.z) || 0;

      // Get raw rotation data
      const rotAlpha = Number(movement?.alpha) || 0;
      const rotBeta = Number(movement?.beta) || 0;
      const rotGamma = Number(movement?.gamma) || 0;

      console.log("Device motion event:", {
        accelX,
        accelY,
        accelZ,
        rotAlpha,
        rotBeta,
        rotGamma,
        permissionState,
      });

      // Always send packets for debugging, even if below deadzone
      console.log("Sending device_motion packet:", {
        accelX,
        accelY,
        accelZ,
        rotAlpha,
        rotBeta,
        rotGamma,
      });
        sendPacket({
          type: "device_motion",
          accel_x: accelX,
          accel_y: accelY,
          accel_z: accelZ,
          rot_alpha: rotAlpha,
          rot_beta: rotBeta,
          rot_gamma: rotGamma,
          timestamp: Date.now(),
          sensitivity: pointerSensitivityRef.current,
        });
    },
    [permissionState, sendPacket],
  );

  // User-initiated permission request
  const requestMotionPermissions = async () => {
    setPermissionState("requesting");
    try {
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof (
          DeviceMotionEvent as unknown as {
            requestPermission?: () => Promise<PermissionState>;
          }
        ).requestPermission === "function"
      ) {
        const result = await (
          DeviceMotionEvent as unknown as {
            requestPermission?: () => Promise<PermissionState>;
          }
        ).requestPermission!();

        if (result === "granted") {
          setPermissionState("granted");
          localStorage.setItem(PERMISSION_STORAGE_KEY, "granted");
          window.addEventListener("devicemotion", handleDeviceMotion);
        } else {
          setPermissionState("denied");
          localStorage.setItem(PERMISSION_STORAGE_KEY, "denied");
        }
      } else {
        // Fallback for browsers that don't require permission
        setPermissionState("granted");
        localStorage.setItem(PERMISSION_STORAGE_KEY, "granted");
        window.addEventListener("devicemotion", handleDeviceMotion);
      }
    } catch (error) {
      console.error("Failed to get sensor permissions:", error);
      setPermissionState("denied");
      localStorage.setItem(PERMISSION_STORAGE_KEY, "denied");
    }
  };

  // WebSocket connection management
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const key = urlParams.get("key");
    if (key) {
      setAuthKey(key);
      connectWebSocket(key);
    } else {
      setConnectionStatus("error");
    }

    return () => {
      isMountedRef.current = false;
      if (ws) {
        ws.close();
      }
      // Clean up device motion listener
      window.removeEventListener("devicemotion", handleDeviceMotion);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWebSocket]);

  // Monitor connection health
  useEffect(() => {
    const healthCheck = setInterval(() => {
      const timeSinceLastMessage = Date.now() - lastMessageTime;
      if (timeSinceLastMessage > 30000 && connectionStatus === "connected") {
        console.warn("Connection appears stale, attempting reconnection...");
        if (authKey && isMountedRef.current) {
          connectWebSocket(authKey);
        }
      }
    }, 10000);

    return () => clearInterval(healthCheck);
  }, [lastMessageTime, connectionStatus, authKey, connectWebSocket]);

  // Check sensor permissions on mount
  useEffect(() => {
    const stored = localStorage.getItem(PERMISSION_STORAGE_KEY);
    if (stored === "granted") {
      setPermissionState("granted");
      // Start listening immediately if previously granted
      if (typeof DeviceMotionEvent !== "undefined") {
        window.addEventListener("devicemotion", handleDeviceMotion);
      }
    } else if (stored === "denied") {
      setPermissionState("denied");
    } else {
      // First time user
      setPermissionState("prompt");
    }
  }, [handleDeviceMotion]);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (permissionState !== "granted") return;

    initialTouchesRef.current = Array.from(e.touches).map(touch => ({
      id: touch.identifier,
      x: touch.clientX,
      y: touch.clientY
    }));
    setTouchActive(true);
  };

  const SCROLL_THRESHOLD = 3; // Minimum movement to trigger scroll

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (initialTouchesRef.current.length === 0 || permissionState !== "granted") return;

    const currentTouches = Array.from(e.touches);

    if (currentTouches.length === 1) {
      // Mouse control
      const touch = currentTouches[0];
      const initial = initialTouchesRef.current.find(t => t.id === touch.identifier);
      if (!initial) return;

      const rawDeltaX = touch.clientX - initial.x;
      const rawDeltaY = touch.clientY - initial.y;

      if (!Number.isFinite(rawDeltaX) || !Number.isFinite(rawDeltaY)) {
        console.error("Invalid touch delta values");
        return;
      }

      sendPacket({
        type: "mouse_move",
        x: Math.round(rawDeltaX),
        y: Math.round(rawDeltaY),
        sensitivity: pointerSensitivityRef.current,
      });

      // Update visual feedback (apply sensitivity for UI)
      const deltaX = rawDeltaX * pointerSensitivity;
      const deltaY = rawDeltaY * pointerSensitivity;
      setCursorPosition((prev) => ({
        x: Math.max(0, Math.min(100, prev.x + deltaX / 3)),
        y: Math.max(0, Math.min(100, prev.y + deltaY / 3)),
      }));

    } else if (currentTouches.length >= 2) {
      // Scroll
      const touch = currentTouches[0];
      const initial = initialTouchesRef.current.find(t => t.id === touch.identifier);
      if (!initial) return;

      const rawDeltaX = touch.clientX - initial.x;
      const rawDeltaY = touch.clientY - initial.y;

      if (!Number.isFinite(rawDeltaX) || !Number.isFinite(rawDeltaY)) {
        console.error("Invalid touch delta values");
        return;
      }

      // Calculate swipe direction and magnitude for UI feedback (apply sensitivity for UI)
      const deltaX = rawDeltaX * scrollSensitivity;
      const deltaY = rawDeltaY * scrollSensitivity;
      const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      setSwipeMagnitude(Math.round(magnitude));

      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setSwipeDirection(deltaX > 0 ? "Right" : "Left");
      } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
        setSwipeDirection(deltaY > 0 ? "Down" : "Up");
      } else {
        const horizontal = deltaX > 0 ? "Right" : "Left";
        const vertical = deltaY > 0 ? "Down" : "Up";
        setSwipeDirection(`${vertical}-${horizontal}`);
      }

      // Only send scroll packets for meaningful movements
      if (
        Math.abs(deltaX) > SCROLL_THRESHOLD ||
        Math.abs(deltaY) > SCROLL_THRESHOLD
      ) {
        sendPacket({
          type: "scroll_move",
          x: Math.round(rawDeltaX),
          y: Math.round(rawDeltaY),
          sensitivity: scrollSensitivityRef.current,
        });
      }

      // Update visual feedback
      setCursorPosition((prev) => ({
        x: Math.max(0, Math.min(100, prev.x + deltaX / 3)),
        y: Math.max(0, Math.min(100, prev.y + deltaY / 3)),
      }));
    }
  };

  const handleTouchEnd = () => {
    initialTouchesRef.current = [];
    setTouchActive(false);
    setSwipeDirection("None");
    setSwipeMagnitude(0);
  };

  const handleLeftTouchStart = () => {
    if (permissionState !== "granted") return;
    setIsLeftPressed(true);
    sendPacket({
      type: swapLeftRightClick ? "right_click_down" : "left_click_down",
    });
  };

  const handleLeftTouchEnd = () => {
    if (permissionState !== "granted") return;
    setIsLeftPressed(false);
    sendPacket({
      type: swapLeftRightClick ? "right_click_up" : "left_click_up",
    });
  };

  const handleRightTouchStart = () => {
    if (permissionState !== "granted") return;
    setIsRightPressed(true);
    sendPacket({
      type: swapLeftRightClick ? "left_click_down" : "right_click_down",
    });
  };

  const handleRightTouchEnd = () => {
    if (permissionState !== "granted") return;
    setIsRightPressed(false);
    sendPacket({
      type: swapLeftRightClick ? "left_click_up" : "right_click_up",
    });
  };

  return (
    <div>
      <Header
        pointerSensitivity={pointerSensitivity}
        onPointerSensitivityChange={setPointerSensitivity}
        scrollSensitivity={scrollSensitivity}
        onScrollSensitivityChange={setScrollSensitivity}
        showSensorLog={showSensorLog}
        onToggleSensorLog={() => setShowSensorLog(!showSensorLog)}
        buttonsAboveTouchpad={buttonsAboveTouchpad}
        onToggleButtonPosition={() =>
          setButtonsAboveTouchpad(!buttonsAboveTouchpad)
        }
        isTable={isTable}
        onToggleIsTable={() => {
          setIsTable(!isTable);
          sendPacket({ type: "switch_mode" });
        }}
        naturalScroll={naturalScroll}
        onToggleNaturalScroll={() => setNaturalScroll(!naturalScroll)}
        onToggleSwapLeftRightClick={() =>
          setSwapLeftRightClick(!swapLeftRightClick)
        }
        connectionStatus={connectionStatus}
        onPause={handlePause}
        onResume={handleResume}
      />

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          gap: 4,
          position: "relative",
        }}
      >
        {buttonsAboveTouchpad && (
          <div>
            <MouseButtons
              isLeftPressed={isLeftPressed}
              isRightPressed={isRightPressed}
              onLeftTouchStart={handleLeftTouchStart}
              onLeftTouchEnd={handleLeftTouchEnd}
              onRightTouchStart={handleRightTouchStart}
              onRightTouchEnd={handleRightTouchEnd}
              swapLeftRightClick={swapLeftRightClick}
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 4,
            gap: 16,
          }}
        >
          <Touchpad
            touchpadRef={touchpadRef}
            touchActive={touchActive}
            cursorPosition={cursorPosition}
            isLeftPressed={isLeftPressed}
            isRightPressed={isRightPressed}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            permissionState={permissionState}
          />
          {!buttonsAboveTouchpad && (
            <MouseButtons
              isLeftPressed={isLeftPressed}
              isRightPressed={isRightPressed}
              onLeftTouchStart={handleLeftTouchStart}
              onLeftTouchEnd={handleLeftTouchEnd}
              onRightTouchStart={handleRightTouchStart}
              onRightTouchEnd={handleRightTouchEnd}
              swapLeftRightClick={swapLeftRightClick}
            />
          )}
        </div>

        {showSensorLog && (
          <SensorLog
            swipeDirection={swipeDirection}
            swipeMagnitude={swipeMagnitude}
          />
        )}
      </main>

      {/* Permission UI Overlays */}
      {permissionState === "checking" && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 1000,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {(permissionState === "prompt" || permissionState === "requesting") && (
        <PermissionPrompt
          onRequestPermissions={requestMotionPermissions}
          isRequesting={permissionState === "requesting"}
        />
      )}

      {permissionState === "denied" && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            p: 4,
            bgcolor: "background.paper",
            borderRadius: 3,
            boxShadow: 3,
            zIndex: 1000,
            minWidth: 350,
          }}
        >
          <Typography variant="h5" color="error.main" sx={{ mb: 2 }}>
            Motion Permissions Required
          </Typography>
          <Typography sx={{ mb: 3, color: "text.secondary" }}>
            Device motion permissions are needed to control the mouse cursor.
            Please enable them in your browser settings or try again.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setPermissionState("prompt")}
            sx={{ mr: 2 }}
          >
            Try Again
          </Button>
          <Button
            variant="text"
            onClick={() => {
              localStorage.removeItem(PERMISSION_STORAGE_KEY);
              setPermissionState("prompt");
            }}
          >
            Reset Settings
          </Button>
        </Box>
      )}
    </div>
  );
}
