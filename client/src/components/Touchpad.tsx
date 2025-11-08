import { Hand } from "lucide-react";
import { RefObject } from "react";

interface TouchpadProps {
  touchpadRef: RefObject<HTMLDivElement>;
  touchActive: boolean;
  cursorPosition: { x: number; y: number };
  isLeftPressed: boolean;
  isRightPressed: boolean;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function Touchpad({
  touchpadRef,
  touchActive,
  cursorPosition,
  isLeftPressed,
  isRightPressed,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: TouchpadProps) {
  return (
    <div
      ref={touchpadRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
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
  );
}