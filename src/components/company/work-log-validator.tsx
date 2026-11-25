"use client";

import React, { useState, useTransition } from "react";
import { validateWorkLog, rejectWorkLog } from "@/app/actions/work-log";
import { WorkLogStatus } from "@prisma/client";
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  User,
  Loader2,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  GraduationCap,
} from "lucide-react";

export interface CompanyInternPlacement {
  id: string;
  status: string;
  offerId: string;
  offer: {
    id: string;
    title: string;
  };
  student: {
    id: string;
    specialization: string;
    studyYear: number;
    group: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  workLogs: {
    id: string;
    date: Date | string;
    hoursWorked: number;
    activitySummary: string;
    status: WorkLogStatus;
    tutorFeedback?: string | null;
    validatedAt?: Date | string | null;
    createdAt: Date | string;
  }[];
}

interface WorkLogValidatorProps {
  placements: CompanyInternPlacement[];
}

export function WorkLogValidator({ placements = [] }: WorkLogValidatorProps) {
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(
    placements[0]?.id || ""
  );
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [activeFeedbackLogId, setActiveFeedbackLogId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>("");
  const [actionType, setActionType] = useState<"VALIDATE" | "REJECT">("VALIDATE");

  const activePlacement =
    placements.find((p) => p.id === selectedPlacementId) || placements[0];

  const handleValidateQuick = (logId: string) => {
    setActionError(null);
    startTransition(async () => {
      try {
        await validateWorkLog(logId);
      } catch (err: any) {
        setActionError(err.message || "Eroare la validarea pontajului.");
      }
    });
  };

  const handleOpenFeedback = (logId: string, type: "VALIDATE" | "REJECT") => {
    setActiveFeedbackLogId(logId);
    setActionType(type);
    setFeedbackText("");
    setActionError(null);
  };

  const handleSubmitFeedback = (logId: string) => {
    if (actionType === "REJECT" && feedbackText.trim().length < 3) {
      setActionError("Te rugăm să specifici motivul respingerii (minim 3 caractere).");
      return;
    }

    setActionError(null);
    startTransition(async () => {
      try {
        if (actionType === "VALIDATE") {
          await validateWorkLog(logId, feedbackText.trim() || undefined);
        } else {
          await rejectWorkLog(logId, feedbackText.trim());
        }
        setActiveFeedbackLogId(null);
        setFeedbackText("");
      } catch (err: any) {
        setActionError(err.message || "Eroare la procesarea pontajului.");
      }
    });
  };

  if (!placements || placements.length === 0) {
    return (
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 p-8 text-center text-slate-400">
        <GraduationCap className="w-10 h-10 mx-auto text-sky-400/60 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Niciun practicant confirmat</h3>
        <p className="text-xs max-w-md mx-auto">
          Nu există studenți cu plasamente confirmate pentru ofertele companiei dumneavoastră în acest moment. Jurnalele de pontaj vor apărea aici odată ce matching-ul este confirmat.
        </p>
      </div>
    );
  }

  // Statistici per student curent
  const logs = activePlacement?.workLogs || [];
  const validatedHours = logs
    .filter((l) => l.status === WorkLogStatus.VALIDATED_TUTOR)
    .reduce((sum, l) => sum + l.hoursWorked, 0);

  const pendingHours = logs
    .filter((l) => l.status === WorkLogStatus.PENDING)
    .reduce((sum, l) => sum + l.hoursWorked, 0);

  return (
    <div className="space-y-6">
      {/* 1. Selector Practicant & Indicatori Rapizi */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl p-6 rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Selectează Practicantul
          </label>
          <select
            value={activePlacement?.id}
            onChange={(e) => setSelectedPlacementId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 text-sm font-bold text-white bg-[#070D19] border border-sky-500/30 rounded-xl focus:outline-none focus:border-sky-400"
          >
            {placements.map((p) => {
              const pendingCount = p.workLogs.filter((w) => w.status === WorkLogStatus.PENDING).length;
              return (
                <option key={p.id} value={p.id}>
                  {p.student.user.firstName} {p.student.user.lastName} — {p.offer.title} {pendingCount > 0 ? `(${pendingCount} în așteptare)` : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-[#070D19] border border-sky-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Ore Validate</span>
            <span className="text-base font-black text-emerald-400">{validatedHours} ore</span>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-[#070D19] border border-sky-500/20 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">În Așteptare</span>
            <span className="text-base font-black text-amber-400">{pendingHours} ore</span>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="p-3 bg-rose-950/50 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* 2. Listă Pontaje Practicant Selectat */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-sky-500/15">
          <div className="flex items-center gap-2">
            <CalendarCheck2 className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Pontaje: {activePlacement.student.user.firstName} {activePlacement.student.user.lastName} ({activePlacement.student.specialization}, Anul {activePlacement.student.studyYear})
            </h3>
          </div>
          <span className="text-xs text-slate-400">{logs.length} înregistrări în total</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-sky-500/20 rounded-xl text-xs">
            Studentul nu a înregistrat încă nicio intrare de pontaj pentru acest stagiu.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const logDate = new Date(log.date);
              const isPendingLog = log.status === WorkLogStatus.PENDING;
              const isFeedbackOpen = activeFeedbackLogId === log.id;

              return (
                <div
                  key={log.id}
                  className={`p-4 rounded-xl border transition ${
                    isPendingLog
                      ? "bg-[#070D19] border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)]"
                      : log.status === WorkLogStatus.VALIDATED_TUTOR
                      ? "bg-[#070D19]/60 border-emerald-500/20"
                      : "bg-[#070D19]/40 border-rose-500/20"
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          {logDate.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                        </span>
                        <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-500/30 rounded-md font-bold">
                          {log.hoursWorked} ore
                        </span>
                        {log.status === WorkLogStatus.VALIDATED_TUTOR && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validat
                          </span>
                        )}
                        {log.status === WorkLogStatus.PENDING && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-400" /> Necesită Validare
                          </span>
                        )}
                        {log.status === WorkLogStatus.REJECTED && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" /> Respins
                          </span>
                        )}
                      </div>

                      <p className="text-slate-300 text-xs pt-1 leading-relaxed whitespace-pre-wrap">
                        {log.activitySummary}
                      </p>

                      {log.tutorFeedback && (
                        <div className="mt-1.5 text-[11px] text-slate-400 italic">
                          Feedback acordat: &ldquo;{log.tutorFeedback}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Butoane Acțiune pentru Intrări PENDING */}
                    {isPendingLog && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleValidateQuick(log.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          <span>Aprobă</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleOpenFeedback(log.id, "VALIDATE")}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#070D19] hover:bg-sky-500/10 border border-sky-500/30 text-sky-300 rounded-lg text-xs font-semibold transition"
                          title="Aprobă cu notă/feedback"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>+ Feedback</span>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleOpenFeedback(log.id, "REJECT")}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/30 text-rose-300 rounded-lg text-xs font-bold transition disabled:opacity-50"
                        >
                          <X className="w-3 h-3" />
                          <span>Respinge</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Panou expandat pentru introducere Feedback / Motiv Respingere */}
                  {isFeedbackOpen && (
                    <div className="mt-3 pt-3 border-t border-sky-500/20 space-y-2">
                      <label className="block text-xs font-semibold text-slate-300">
                        {actionType === "VALIDATE"
                          ? "Feedback opțional pentru student:"
                          : "Motivul respingerii (obligatoriu):"}
                      </label>
                      <textarea
                        rows={2}
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder={
                          actionType === "VALIDATE"
                            ? "Ex: Activitate excelentă, cod bine documentat..."
                            : "Ex: Orele declarate nu corespund cu orarul de lucru convenit..."
                        }
                        className="w-full px-3 py-1.5 bg-[#0B1221] border border-sky-500/30 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleSubmitFeedback(log.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition ${
                            actionType === "VALIDATE"
                              ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                              : "bg-rose-600 text-white hover:bg-rose-500"
                          }`}
                        >
                          {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
                          <span>{actionType === "VALIDATE" ? "Confirmă Validarea" : "Confirmă Respingerea"}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveFeedbackLogId(null)}
                          className="px-2.5 py-1 text-xs text-slate-400 hover:text-white"
                        >
                          Anulează
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
