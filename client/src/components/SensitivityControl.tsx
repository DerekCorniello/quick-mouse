interface SensitivityControlProps {
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
}

export function SensitivityControl({ sensitivity, onSensitivityChange }: SensitivityControlProps) {
  return (
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
        onChange={(e) => onSensitivityChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}