import React from "react";

interface StatsCardProps {
  label: string;
  value: number;
  sub: string;
  variant: "success" | "warning" | "error" | "info";
  icon: React.ReactNode;
}

export function StatsCard({ label, value, sub, variant, icon }: StatsCardProps) {
  const borderColors = {
    success: "border-t-emerald-500",
    warning: "border-t-amber-500",
    error: "border-t-rose-500",
    info: "border-t-blue-500",
  };

  const iconBgColors = {
    success: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
    error: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400",
    info: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  };

  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm border-t-4 ${borderColors[variant]} transition-all hover:shadow-md flex flex-col justify-between`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <div className={`p-2 rounded-lg ${iconBgColors[variant]}`}>{icon}</div>
      </div>
      <div className="mt-4">
        <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {value}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">{sub}</div>
      </div>
    </div>
  );
}
