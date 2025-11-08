import { MousePointer2 } from "lucide-react";

export function Header() {
  return (
    <div className="p-4 bg-slate-950/50 border-b border-slate-700">
      <div className="flex items-center gap-2 text-white">
        <MousePointer2 className="w-5 h-5" />
        <h1>Quick Mouse</h1>
      </div>
    </div>
  );
}