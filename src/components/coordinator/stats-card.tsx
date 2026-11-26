import React from "react";

interface StatsCardProps {
  label: string;
  value: number;
  sub: string;
  variant: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
  onClick?: () => void;
}

export function StatsCard({ label, value, sub, variant, icon, onClick }: StatsCardProps) {
  const borderColors = {
    success: "border-t-emerald-400",
    warning: "border-t-amber-400",
    error: "border-t-rose-400",
    info: "border-t-sky-400",
  };

  const iconBgColors = {
    success: "bg-emerald-950/60 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
    warning: "bg-amber-950/60 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
    error: "bg-rose-950/60 text-rose-400 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.2)]",
    info: "bg-sky-950/60 text-sky-400 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.2)]",
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-[#0B1221]/88 backdrop-blur-xl rounded-xl p-5 border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] border-t-4 ${borderColors[variant]} transition-all hover:border-sky-400/40 flex flex-col justify-between ${
        onClick ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99]" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${iconBgColors[variant]}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-extrabold text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs text-slate-400 mt-1 font-medium">{sub}</div>
      </div>
    </div>
  );
}
