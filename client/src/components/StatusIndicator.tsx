interface StatusIndicatorProps {
  cursorPosition: { x: number; y: number };
}

export function StatusIndicator({ cursorPosition }: StatusIndicatorProps) {
  return (
    <div className="p-4 pb-8 bg-slate-950/50 border-t border-slate-700">
      <div className="text-center">
        <p className="text-slate-400 text-sm">
          Cursor: ({Math.round(cursorPosition.x)},{" "}
          {Math.round(cursorPosition.y)})
        </p>
      </div>
    </div>
  );
}