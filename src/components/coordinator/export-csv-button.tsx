"use client";

import React, { useState, useTransition } from "react";
import { exportPlacementsCsv } from "@/app/actions/coordinator";
import { Download, Loader2 } from "lucide-react";

export function ExportCsvButton() {
  const [isPending, startTransition] = useTransition();

  const handleExport = () => {
    startTransition(async () => {
      try {
        const { csv, filename } = await exportPlacementsCsv();
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (err: any) {
        alert(err.message || "A apărut o eroare la descărcarea fișierului CSV.");
      }
    });
  };

  return (
    <button
      onClick={handleExport}
      disabled={isPending}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
    >
      {isPending ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5" />
      )}
      <span>Export CSV</span>
    </button>
  );
}
