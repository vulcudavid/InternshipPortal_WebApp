"use client";

import React, { useState, useTransition } from "react";
import { createWorkLog } from "@/app/actions/work-log";
import { WorkLogStatus } from "@prisma/client";
import {
  CalendarCheck2,
  Clock,
  Plus,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Award,
  Loader2,
  Calendar,
  FileText,
  UserCheck,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export interface WorkLogItem {
  id: string;
  date: Date | string;
  hoursWorked: number;
  activitySummary: string;
  status: WorkLogStatus;
  tutorFeedback?: string | null;
  validatedAt?: Date | string | null;
  createdAt: Date | string;
}

export interface FinalEvaluationData {
  id: string;
  grade: number | null;
  feedback: string | null;
  competenciesAcquired: string[];
  evaluatorName: string;
  submittedAt: Date | string;
}

interface WorkLogManagerProps {
  placementId: string;
  workLogs: WorkLogItem[];
  requiredHours?: number;
  evaluation?: FinalEvaluationData | null;
  offerTitle?: string;
  companyName?: string;
}

export function WorkLogManager({
  placementId,
  workLogs = [],
  requiredHours = 90,
  evaluation = null,
  offerTitle = "Stagiu de practică",
  companyName = "Companie parteneră",
}: WorkLogManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [hoursWorked, setHoursWorked] = useState<number>(6);
  const [activitySummary, setActivitySummary] = useState<string>("");
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Calcule statistici ore
  const validatedHours = workLogs
    .filter((w) => w.status === WorkLogStatus.VALIDATED_TUTOR)
    .reduce((sum, w) => sum + w.hoursWorked, 0);

  const pendingHours = workLogs
    .filter((w) => w.status === WorkLogStatus.PENDING)
    .reduce((sum, w) => sum + w.hoursWorked, 0);

  const targetHours = requiredHours || 90;
  const progressPercent = Math.min(100, Math.round((validatedHours / targetHours) * 100));

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (hoursWorked <= 0 || hoursWorked > 12) {
      setMsg({ type: "error", text: "Numărul de ore trebuie să fie între 1 și 12." });
      return;
    }

    if (activitySummary.trim().length < 5) {
      setMsg({ type: "error", text: "Rezumatul activității trebuie să aibă minim 5 caractere." });
      return;
    }

    startTransition(async () => {
      try {
        await createWorkLog({
          placementId,
          date,
          hoursWorked: Number(hoursWorked),
          activitySummary: activitySummary.trim(),
        });
        setActivitySummary("");
        setMsg({ type: "success", text: "Intrarea în jurnal a fost adăugată și trimisă spre validare tutorelui!" });
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Eroare la adăugarea intrării în jurnal." });
      }
    });
  };

  const getStatusBadge = (status: WorkLogStatus) => {
    switch (status) {
      case WorkLogStatus.VALIDATED_TUTOR:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Validat
          </span>
        );
      case WorkLogStatus.PENDING:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3 text-amber-400" /> În Așteptare
          </span>
        );
      case WorkLogStatus.REJECTED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3 text-rose-400" /> Respins
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Progres & Indicatori KPI */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-sky-500/15">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-sky-300 bg-sky-500/15 px-2.5 py-0.5 rounded-full border border-sky-500/30">
                <CalendarCheck2 className="w-3.5 h-3.5 text-sky-400" /> Jurnal Săptămânal de Pontaj
              </span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{offerTitle}</h2>
            <p className="text-xs text-slate-400">Partener de practică: {companyName}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3.5 py-2 rounded-xl bg-[#070D19] border border-sky-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Ore Validate</span>
              <span className="text-lg font-black text-emerald-400">{validatedHours} <span className="text-xs font-normal text-slate-500">/ {targetHours}h</span></span>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-[#070D19] border border-sky-500/20 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">În Așteptare</span>
              <span className="text-lg font-black text-amber-400">{pendingHours}h</span>
            </div>
          </div>
        </div>

        {/* Progres Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              Progres realizare stagiu: <strong className="text-white">{validatedHours} ore validate</strong>
            </span>
            <span className="text-sky-300 font-bold">{progressPercent}% finalizat</span>
          </div>
          <div className="w-full bg-[#070D19] rounded-full h-3 border border-sky-500/20 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-sky-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(14,165,233,0.5)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Fișă de Evaluare Finală (Dacă este completată de tutore) */}
      {evaluation && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-[#0B1221] to-sky-950/40 backdrop-blur-xl rounded-2xl border border-emerald-500/30 shadow-[0_0_25px_rgba(16,185,129,0.12)] p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-white">Fișa de Evaluare Finală a Stagiului</h3>
            </div>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-black">
              Notă Finală: {Number(evaluation.grade).toFixed(1)} / 10
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-[#070D19]/80 rounded-xl border border-emerald-500/20 space-y-1">
              <span className="text-slate-400 block font-semibold">Evaluator (Tutore Firmă):</span>
              <span className="text-white font-bold">{evaluation.evaluatorName}</span>
              <span className="text-[11px] text-slate-500 block">
                Completat la: {new Date(evaluation.submittedAt).toLocaleDateString("ro-RO")}
              </span>
            </div>

            <div className="p-3 bg-[#070D19]/80 rounded-xl border border-emerald-500/20 space-y-1">
              <span className="text-slate-400 block font-semibold">Competențe Dobândite & Validate:</span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {evaluation.competenciesAcquired.map((comp, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 rounded-md text-[11px] font-semibold"
                  >
                    {comp}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3.5 bg-[#070D19]/80 rounded-xl border border-emerald-500/20 space-y-1">
            <span className="text-xs font-semibold text-slate-400">Apreciere Tutore & Concluzii:</span>
            <p className="text-xs text-slate-200 italic leading-relaxed whitespace-pre-wrap">
              &ldquo;{evaluation.feedback}&rdquo;
            </p>
          </div>
        </div>
      )}

      {/* 3. Formular Adăugare Pontaj */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-4 h-4 text-sky-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Adaugă Intrare în Pontaj
          </h3>
        </div>

        {msg && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              msg.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300"
                : "bg-rose-950/50 border-rose-500/40 text-rose-300"
            }`}
          >
            {msg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{msg.text}</span>
          </div>
        )}

        <form onSubmit={handleAddLog} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Data Activității</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">Ore Lucrate (1 - 12)</label>
              <input
                type="number"
                min={1}
                max={12}
                required
                value={hoursWorked}
                onChange={(e) => setHoursWorked(Number(e.target.value))}
                className="w-full px-3 py-2 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-300">
              Rezumat Activitate Efectuată
            </label>
            <textarea
              required
              rows={3}
              value={activitySummary}
              onChange={(e) => setActivitySummary(e.target.value)}
              placeholder="Ex: Dezvoltare componentă autentificare, configurare rute API, participare la standup..."
              className="w-full px-3 py-2 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(14,165,233,0.3)] transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Înregistrează Orele</span>
          </button>
        </form>
      </div>

      {/* 4. Tabel / Istoric Pontaje */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-sky-400" />
          Istoric Pontaje Înregistrate ({workLogs.length})
        </h3>

        {workLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-sky-500/20 rounded-xl text-xs">
            Nu ai înregistrat încă nicio intrare de pontaj. Completează formularul de mai sus pentru a trimite orele spre validare.
          </div>
        ) : (
          <div className="space-y-3">
            {workLogs.map((log) => {
              const logDate = new Date(log.date);
              return (
                <div
                  key={log.id}
                  className="p-4 bg-[#070D19]/80 rounded-xl border border-sky-500/20 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        {logDate.toLocaleDateString("ro-RO", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
                      </span>
                      <span className="px-2 py-0.5 bg-sky-950 text-sky-300 border border-sky-500/30 rounded-md font-bold">
                        {log.hoursWorked} ore
                      </span>
                      {getStatusBadge(log.status)}
                    </div>
                    <p className="text-slate-300 text-xs pt-1 leading-relaxed whitespace-pre-wrap">
                      {log.activitySummary}
                    </p>
                    {log.tutorFeedback && (
                      <div className="mt-2 p-2.5 bg-slate-900/90 rounded-lg border border-slate-700/60 text-[11px] text-amber-300/90 flex items-start gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                        <span><strong>Feedback Tutore:</strong> {log.tutorFeedback}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
