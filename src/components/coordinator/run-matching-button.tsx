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
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold rounded-lg shadow-sm hover:shadow transition-all duration-150 cursor-pointer disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Se execută Gale-Shapley...</span>
          </>
        ) : (
          <>
            <Play className="w-4 h-4 fill-white" />
            <span>Rulează Gale-Shapley</span>
          </>
        )}
      </button>

      {feedback && (
        <div
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
}
