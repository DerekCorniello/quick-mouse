import { Circle } from "lucide-react";

interface MouseButtonsProps {
  isLeftPressed: boolean;
  isRightPressed: boolean;
  onLeftClick: () => void;
  onRightClick: () => void;
}

export function MouseButtons({ isLeftPressed, isRightPressed, onLeftClick, onRightClick }: MouseButtonsProps) {
  return (
    <div className="p-4 bg-slate-950/50 border-b border-slate-700">
      <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
        {/* Left Click */}
        <button
          onTouchStart={onLeftClick}
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
          onTouchStart={onRightClick}
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
  );
}