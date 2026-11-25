"use client";

import React, { useState, useTransition } from "react";
import { runMinimalReallocationAction } from "@/app/actions/coordinator";
import { RefreshCw, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function MinimalReallocationButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRunMinimalReallocation = () => {
    const confirmed = window.confirm(
      "Doriți să inițiați Realocarea Minimală?\n\nAlgoritmul va căuta potriviri doar pentru studenții care au refuzat sau nu au primit loc, pe baza locurilor eliberate. Studenții CONFIRMAȚI nu vor fi afectați în niciun fel."
    );

    if (!confirmed) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await runMinimalReallocationAction();
        setFeedback({
          type: "success",
          message: result.message,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "A apărut o eroare la rularea realocării minimale.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleRunMinimalReallocation}
        disabled={isPending}
        title="Realocare Minimală pentru studenți nealocați / refuzați"
        className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(99,102,241,0.35)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Se execută realocarea...</span>
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 text-indigo-200" />
            <span>Realocare Minimală</span>
          </>
        )}
      </button>

      {feedback && (
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border ${
            feedback.type === "success"
              ? "bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
              : "bg-rose-950/50 text-rose-300 border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
