import { useState, useRef } from "react";
import { Header } from "./components/Header";
import { MouseButtons } from "./components/MouseButtons";
import { Touchpad } from "./components/Touchpad";
import { SensitivityControl } from "./components/SensitivityControl";
import { StatusIndicator } from "./components/StatusIndicator";
import { SensorLog } from "./components/SensorLog";

export default function App() {
  const [cursorPosition, setCursorPosition] = useState({ x: 50, y: 50 });
  const [isLeftPressed, setIsLeftPressed] = useState(false);
  const [isRightPressed, setIsRightPressed] = useState(false);
  const [touchActive, setTouchActive] = useState(false);
  const [sensitivity, setSensitivity] = useState(2);
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

    setCursorPosition((prev) => ({
      x: Math.max(0, Math.min(100, prev.x + deltaX / 3)),
      y: Math.max(0, Math.min(100, prev.y + deltaY / 3)),
    }));

    lastTouchRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = () => {
    lastTouchRef.current = null;
    setTouchActive(false);
  };

  const handleLeftClick = () => {
    setIsLeftPressed(true);
    setTimeout(() => setIsLeftPressed(false), 150);
  };

  const handleRightClick = () => {
    setIsRightPressed(true);
    setTimeout(() => setIsRightPressed(false), 150);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex flex-col">
      <Header />

      <MouseButtons
        isLeftPressed={isLeftPressed}
        isRightPressed={isRightPressed}
        onLeftClick={handleLeftClick}
        onRightClick={handleRightClick}
      />

      {/* Touchpad Area - Middle */}
      <div className="flex-1 flex flex-col p-4 gap-4">
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

        <SensitivityControl
          sensitivity={sensitivity}
          onSensitivityChange={setSensitivity}
        />
      </div>

      <StatusIndicator cursorPosition={cursorPosition} />
      <SensorLog />
    </div>
  );
}

