import { useState, useRef, useEffect } from "react";
import { MousePointer2, Hand, Circle } from "lucide-react";

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
      {/* Header */}
      <div className="p-4 bg-slate-950/50 border-b border-slate-700">
        <div className="flex items-center gap-2 text-white">
          <MousePointer2 className="w-5 h-5" />
          <h1>Quick Mouse</h1>
        </div>
      </div>

      {/* Mouse Buttons - Top Half */}
      <div className="p-4 bg-slate-950/50 border-b border-slate-700">
        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
          {/* Left Click */}
          <button
            onTouchStart={handleLeftClick}
            className={`h-40 rounded-2xl border-4 transition-all active:scale-95 ${
              isLeftPressed
                ? "bg-green-500 border-green-400 shadow-lg shadow-green-500/50"
                : "bg-slate-700 border-slate-600 active:bg-slate-600"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-white">
              <Circle className="w-10 h-10" />
              <span>Left Click</span>
            </div>
          </button>

          {/* Right Click */}
          <button
            onTouchStart={handleRightClick}
            className={`h-40 rounded-2xl border-4 transition-all active:scale-95 ${
              isRightPressed
                ? "bg-purple-500 border-purple-400 shadow-lg shadow-purple-500/50"
                : "bg-slate-700 border-slate-600 active:bg-slate-600"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2 text-white">
              <Circle className="w-10 h-10" />
              <span>Right Click</span>
            </div>
          </button>
        </div>
      </div>

      {/* Touchpad Area - Middle */}
      <div className="flex-1 flex flex-col p-4 gap-4">
        <div
          ref={touchpadRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className={`relative flex-1 bg-gradient-to-br from-slate-700 to-slate-800 rounded-3xl border-4 transition-all ${
            touchActive
              ? "border-blue-500 shadow-lg shadow-blue-500/50"
              : "border-slate-600"
          } overflow-hidden touch-none`}
        >
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="grid grid-cols-8 grid-rows-8 h-full w-full">
              {Array.from({ length: 64 }).map((_, i) => (
                <div key={i} className="border border-slate-500" />
              ))}
            </div>
          </div>

          {/* Touch Indicator */}
          {touchActive && (
            <div className="absolute inset-0 bg-blue-500/10 animate-pulse" />
          )}

          {/* Cursor Position Indicator */}
          <div
            className="absolute w-12 h-12 transition-all duration-75"
            style={{
              left: `${cursorPosition.x}%`,
              top: `${cursorPosition.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div
              className={`w-full h-full rounded-full border-3 transition-colors ${
                isLeftPressed
                  ? "bg-green-500 border-green-400"
                  : isRightPressed
                    ? "bg-purple-500 border-purple-400"
                    : "bg-blue-500/50 border-blue-400"
              }`}
            />
          </div>

          {/* Instructions */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
            <Hand className="w-16 h-16 text-slate-500 mx-auto mb-2" />
            <p className="text-slate-400">Slide to move cursor</p>
          </div>
        </div>

        {/* Sensitivity Control */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-300">Sensitivity</span>
            <span className="text-blue-400">{sensitivity}x</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Status Indicator - Bottom */}
      <div className="p-4 pb-8 bg-slate-950/50 border-t border-slate-700">
        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Cursor: ({Math.round(cursorPosition.x)},{" "}
            {Math.round(cursorPosition.y)})
          </p>
        </div>
      </div>
    </div>
  );
}

