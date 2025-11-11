import { useState, useRef, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { MouseButtons } from "./components/MouseButtons";
import { Touchpad } from "./components/Touchpad";
import { SensorLog } from "./components/SensorLog";
import { PermissionPrompt } from "./components/PermissionPrompt";
import { CalibrationDialog } from "./components/CalibrationDialog";
import {
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleLeftTouchStart,
  handleLeftTouchEnd,
  handleRightTouchStart,
  handleRightTouchEnd,
} from "./touchHandlers";

export default function App() {
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [showSensorLog, setShowSensorLog] = useState(false);
  const [buttonsAboveTouchpad, setButtonsAboveTouchpad] = useState(true);
  const [naturalScroll, setNaturalScroll] = useState(false);
  const [swapLeftRightClick, setSwapLeftRightClick] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<string>("None");
  const [swipeMagnitude, setSwipeMagnitude] = useState<number>(0);
  const calibrationCountRef = useRef(0);
  const [calibrationStarted, setCalibrationStarted] = useState(false);
  const [calibrationComplete, setCalibrationComplete] = useState(false);
  const isPausedRef = useRef(false);
   const [pointerSensitivity, setPointerSensitivity] = useState(5);
   const [handheldSensitivity, setHandheldSensitivity] = useState(5);
   const [scrollSensitivity, setScrollSensitivity] = useState(5);
   const pointerSensitivityRef = useRef(5);
   const handheldSensitivityRef = useRef(5);
   const scrollSensitivityRef = useRef(5);
  const scrollAccumulatorRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

   // Keep refs in sync with state
   useEffect(() => {
     pointerSensitivityRef.current = pointerSensitivity;
   }, [pointerSensitivity]);

   useEffect(() => {
     handheldSensitivityRef.current = handheldSensitivity;
   }, [handheldSensitivity]);

   useEffect(() => {
     scrollSensitivityRef.current = scrollSensitivity;
   }, [scrollSensitivity]);

  const handlePause = useCallback(() => {
    isPausedRef.current = true;
  }, []);

  const handleResume = useCallback(() => {
    isPausedRef.current = false;
  }, []);

  const handleCalibrationComplete = useCallback(() => {
    setAppPhase("main");
  }, []);

  const handleStartCalibration = useCallback(() => {
    setCalibrationStarted(true);
  }, []);

  const handleRecalibrate = useCallback(() => {
    setAppPhase("calibrating");
    calibrationCountRef.current = 0;
    setCalibrationStarted(false);
    setCalibrationComplete(false);
  }, []);

  const handlePermissionsGranted = useCallback(() => {
    setAppPhase("calibrating");
    calibrationCountRef.current = 0;
    setCalibrationStarted(false);
    setCalibrationComplete(false);
  }, []);
  const initialTouchesRef = useRef<{ id: number; x: number; y: number }[]>([]);
  const touchpadRef = useRef<HTMLDivElement>(null);

  // App phase
  const [appPhase, setAppPhase] = useState<
    "permissions" | "calibrating" | "main"
  >("permissions");

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
          JSON.parse(event.data);
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
            console.error(
              "Invalid packet sensitivity value:",
              packet.sensitivity,
            );
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
  const handleDeviceOrientation = useCallback(
    (event: DeviceOrientationEvent) => {
      if (appPhase === "permissions") {
        return;
      }

      // Get raw rotation data
      const rotAlpha = Number(event.alpha) || 0;
      const rotBeta = Number(event.beta) || 0;
      const rotGamma = Number(event.gamma) || 0;

      if (
        appPhase === "calibrating" &&
        calibrationStarted &&
        !calibrationComplete
      ) {
        // Send calibration packet
        sendPacket({
          type: "calibration",
          rot_alpha: rotAlpha,
          rot_beta: rotBeta,
          rot_gamma: rotGamma,
          timestamp: Date.now(),
        });
        calibrationCountRef.current += 1;
        if (calibrationCountRef.current >= 100) {
          sendPacket({ type: "calibration_done" });
          setCalibrationComplete(true);
        }
      } else if (appPhase === "main") {
        // Send normal device_motion packet
        sendPacket({
          type: "device_motion",
          rot_alpha: rotAlpha,
          rot_beta: rotBeta,
          rot_gamma: rotGamma,
          timestamp: Date.now(),
          handheldSensitivity: handheldSensitivityRef.current,
        });
      }
    },
    [appPhase, sendPacket, calibrationStarted, calibrationComplete],
  );

  // User-initiated permission request
  const requestMotionPermissions = useCallback(async () => {
    try {
      let motionGranted = false;

      // Request device motion permission
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
        motionGranted = result === "granted";
      }

      if (motionGranted) {
        handlePermissionsGranted();
      }
    } catch (error) {
      console.error("Failed to get sensor permissions:", error);
    }
  }, [handlePermissionsGranted]);

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
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
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

  // Add device orientation listener on mount
  useEffect(() => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      window.addEventListener("deviceorientation", handleDeviceOrientation);
    }
    return () => {
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [handleDeviceOrientation]);

  // Handle calibration completion delay
  useEffect(() => {
    if (calibrationComplete) {
      const timer = setTimeout(() => {
        setAppPhase("main");
        setCalibrationComplete(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [calibrationComplete]);















  return (
    <div>
       <Header
         pointerSensitivity={pointerSensitivity}
         onPointerSensitivityChange={setPointerSensitivity}
         handheldSensitivity={handheldSensitivity}
         onHandheldSensitivityChange={setHandheldSensitivity}
         scrollSensitivity={scrollSensitivity}
         onScrollSensitivityChange={setScrollSensitivity}
        showSensorLog={showSensorLog}
        onToggleSensorLog={() => setShowSensorLog(!showSensorLog)}
        buttonsAboveTouchpad={buttonsAboveTouchpad}
        onToggleButtonPosition={() =>
          setButtonsAboveTouchpad(!buttonsAboveTouchpad)
        }
        naturalScroll={naturalScroll}
        onToggleNaturalScroll={() => setNaturalScroll(!naturalScroll)}
        onToggleSwapLeftRightClick={() =>
          setSwapLeftRightClick(!swapLeftRightClick)
        }
        connectionStatus={connectionStatus}
        onPause={handlePause}
        onResume={handleResume}
        onRecalibrate={handleRecalibrate}
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
              onLeftTouchStart={() => handleLeftTouchStart(appPhase, setIsLeftPressed, sendPacket, swapLeftRightClick)}
              onLeftTouchEnd={() => handleLeftTouchEnd(appPhase, setIsLeftPressed, sendPacket, swapLeftRightClick)}
              onRightTouchStart={() => handleRightTouchStart(appPhase, setIsRightPressed, sendPacket, swapLeftRightClick)}
              onRightTouchEnd={() => handleRightTouchEnd(appPhase, setIsRightPressed, sendPacket, swapLeftRightClick)}
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
            isLeftPressed={isLeftPressed}
            isRightPressed={isRightPressed}
            onTouchStart={(e) => handleTouchStart(e, appPhase, initialTouchesRef, setTouchActive)}
            onTouchMove={(e) => handleTouchMove(e, initialTouchesRef, sendPacket, pointerSensitivityRef, scrollSensitivityRef, scrollAccumulatorRef, naturalScroll, rafIdRef)}
            onTouchEnd={() => handleTouchEnd(initialTouchesRef, setTouchActive, setSwipeDirection, setSwipeMagnitude, rafIdRef)}
            permissionState={appPhase === "main" ? "granted" : "denied"}
          />
          {!buttonsAboveTouchpad && (
            <MouseButtons
              isLeftPressed={isLeftPressed}
              isRightPressed={isRightPressed}
              onLeftTouchStart={() => handleLeftTouchStart(appPhase, setIsLeftPressed, sendPacket, swapLeftRightClick)}
              onLeftTouchEnd={() => handleLeftTouchEnd(appPhase, setIsLeftPressed, sendPacket, swapLeftRightClick)}
              onRightTouchStart={() => handleRightTouchStart(appPhase, setIsRightPressed, sendPacket, swapLeftRightClick)}
              onRightTouchEnd={() => handleRightTouchEnd(appPhase, setIsRightPressed, sendPacket, swapLeftRightClick)}
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

      {appPhase === "permissions" && (
        <PermissionPrompt
          onRequestPermissions={requestMotionPermissions}
          isRequesting={false}
        />
      )}

      {appPhase === "calibrating" && (
        <CalibrationDialog
          onCalibrationComplete={handleCalibrationComplete}
          onStartCalibration={handleStartCalibration}
        />
      )}
    </div>
  );
}
