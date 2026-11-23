"use client";

import React, { useState, useTransition } from "react";
import { runMatchingAction } from "@/app/actions/coordinator";
import { Play, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function RunMatchingButton() {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleRunMatching = () => {
    const confirmed = window.confirm(
      "Sunteți sigur că doriți să rulați algoritmul Gale-Shapley?\n\nToți studenții neconfirmați vor fi repartizați stabil către ofertele alese. Plasamentele existente CONFIRMED vor fi protejate și nu vor fi modificate."
    );

    if (!confirmed) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await runMatchingAction();
        setFeedback({
          type: "success",
          message: `Algoritm finalizat: ${result.created} plasamente create, ${result.updated} actualizate, ${result.unassigned.length} studenți nealocați.`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          message: err.message || "A apărut o eroare la rularea algoritmului Gale-Shapley.",
        });
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleRunMatching}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-sm font-bold rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.35)] hover:shadow-[0_0_25px_rgba(14,165,233,0.5)] transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            <span>Se execută Gale-Shapley...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-slate-950" />
            <span>Rulează Gale-Shapley</span>
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
