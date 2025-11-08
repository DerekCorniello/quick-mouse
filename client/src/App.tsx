import { useState, useRef } from "react";
import { Header } from "./components/Header";
import { MouseButtons } from "./components/MouseButtons";
import { Touchpad } from "./components/Touchpad";
import { StatusIndicator } from "./components/StatusIndicator";
import { SensorLog } from "./components/SensorLog";

export default function App() {
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [sensitivity, setSensitivity] = useState(2);
  const [showSensorLog, setShowSensorLog] = useState(false);
  const [buttonsAboveTouchpad, setButtonsAboveTouchpad] = useState(true);
  const [swipeDirection, setSwipeDirection] = useState<string>('None');
  const [swipeMagnitude, setSwipeMagnitude] = useState<number>(0);
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null);
  const touchpadRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
    setTouchActive(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!lastTouchRef.current) return;

    const touch = e.touches[0];
    const deltaX = (touch.clientX - lastTouchRef.current.x) * sensitivity;
    const deltaY = (touch.clientY - lastTouchRef.current.y) * sensitivity;

    // Calculate swipe direction and magnitude
    const magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    setSwipeMagnitude(Math.round(magnitude));

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      // Horizontal movement is dominant
      setSwipeDirection(deltaX > 0 ? 'Right' : 'Left');
    } else if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertical movement is dominant
      setSwipeDirection(deltaY > 0 ? 'Down' : 'Up');
    } else {
      // Diagonal movement
      const horizontal = deltaX > 0 ? 'Right' : 'Left';
      const vertical = deltaY > 0 ? 'Down' : 'Up';
      setSwipeDirection(`${vertical}-${horizontal}`);
    }

    setCursorPosition((prev) => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX / 3)),
      y: Math.max(0, Math.min(100, prev.y + deltaY / 3)),
    }));

    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    setTouchActive(false);
    setSwipeDirection('None');
    setSwipeMagnitude(0);
  };

  const handleLeftTouchStart = () => {
    setIsLeftPressed(true);
  };

  const handleLeftTouchEnd = () => {
    setIsLeftPressed(false);
  };

  const handleRightTouchStart = () => {
    setIsRightPressed(true);
  };

  const handleRightTouchEnd = () => {
    setIsRightPressed(false);
  };

  return (
    <div>
      <Header
        sensitivity={sensitivity}
        onSensitivityChange={setSensitivity}
        showSensorLog={showSensorLog}
        onToggleSensorLog={() => setShowSensorLog(!showSensorLog)}
        buttonsAboveTouchpad={buttonsAboveTouchpad}
        onToggleButtonPosition={() => setButtonsAboveTouchpad(!buttonsAboveTouchpad)}
      />

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          gap: 16,
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
            />
          </div>
        )}

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: 16,
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
          />
        </div>

        {!buttonsAboveTouchpad && (
          <div>
            <MouseButtons
              isLeftPressed={isLeftPressed}
              isRightPressed={isRightPressed}
              onLeftTouchStart={handleLeftTouchStart}
              onLeftTouchEnd={handleLeftTouchEnd}
              onRightTouchStart={handleRightTouchStart}
              onRightTouchEnd={handleRightTouchEnd}
            />
          </div>
        )}

        <StatusIndicator swipeDirection={swipeDirection} swipeMagnitude={swipeMagnitude} />
        {showSensorLog && (
          <div style={{ padding: 16 }}>
            <SensorLog />
          </div>
        )}
      </main>
    </div>
  );
}
