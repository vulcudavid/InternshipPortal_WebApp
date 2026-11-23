import React from "react";
import { CoordinatorDashboardData } from "@/app/actions/coordinator";
import { StatsCard } from "./stats-card";
import { PlacementsTable } from "./placements-table";
import { RunMatchingButton } from "./run-matching-button";
import { ExportCsvButton } from "./export-csv-button";
import {
  Users,
  CheckCircle2,
  Clock,
  UserX,
  FileWarning,
  CalendarCheck2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";

interface CoordinatorDashboardProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  data: CoordinatorDashboardData;
}

export function CoordinatorDashboard({ user, data }: CoordinatorDashboardProps) {
  const { stats, recentPlacements } = data;

  const placementRate =
    stats.totalEligibleStudents > 0
      ? Math.round((stats.totalConfirmed / stats.totalEligibleStudents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Topbar / Header Acțiuni Coordonator ─────────────────────────────── */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-xl p-5 border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-950/60 text-sky-300 border border-sky-500/30">
              <GraduationCap className="w-3.5 h-3.5 text-sky-400" /> Coordonator Academic
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs font-medium text-slate-400">
              Facultatea de Inginerie ULBS
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white mt-1.5 tracking-tight">
            Panou Coordonare Practică & Repartizare Stabilă
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Conectat ca {user.firstName} {user.lastName} ({user.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ExportCsvButton />
          <RunMatchingButton />
        </div>
      </div>

      {/* ── Banner Notificare Plasamente În Așteptare ───────────────────────── */}
      {stats.totalPending > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-300">
              Există {stats.totalPending} plasamente nou generate în așteptarea confirmării
            </h3>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Algoritmul Gale-Shapley a alocat candidații. Puteți valida plasamentele individual sau în bloc din tabelul de mai jos.
            </p>
          </div>
        </div>
      )}

      {/* ── Grid KPI Statistici Principale ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          label="Studenți Înscriși"
          value={stats.totalEligibleStudents}
          sub="Studenți cu preferințe exprimate"
          variant="info"
          icon={<Users className="w-5 h-5" />}
        />
        <StatsCard
          label="Plasamente Confirmate"
          value={stats.totalConfirmed}
          sub="Locuri protejate la re-rulări"
          variant="success"
          icon={<CheckCircle2 className="w-5 h-5" />}
        />
        <StatsCard
          label="În Așteptare"
          value={stats.totalPending}
          sub="Necesită aprobare coordonator"
          variant="warning"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatsCard
          label="Studenți Neplasați"
          value={stats.totalUnplaced}
          sub="Fără ofertă acceptată în runda curentă"
          variant="error"
          icon={<UserX className="w-5 h-5" />}
        />
      </div>

      {/* ── Bară de Progres & Indicatori Suplimentari ───────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card Progres Ocupare */}
        <div className="md:col-span-2 bg-[#0B1221]/88 backdrop-blur-xl rounded-xl p-5 border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rata de Plasare Confirmată
              </span>
              <span className="text-sm font-extrabold text-sky-400">
                {placementRate}%
              </span>
            </div>
            <div className="w-full bg-[#070D19] border border-sky-500/20 rounded-full h-3 mt-3 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-sky-500 to-cyan-400 h-3 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(14,165,233,0.5)]"
                style={{ width: `${Math.min(100, placementRate)}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shadow-[0_0_6px_#34d399]" />
              {stats.totalConfirmed} Confirmate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_#fbbf24]" />
              {stats.totalPending} În așteptare
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block shadow-[0_0_6px_#f87171]" />
              {stats.totalUnplaced} Nealocați
            </span>
          </div>
        </div>

        {/* Card Indicatori Convenții & Jurnale */}
        <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-xl p-5 border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Documente & Monitorizare
          </span>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <FileWarning className="w-4 h-4 text-amber-400" /> Convenții nesemnate:
              </span>
              <span className="font-bold text-white">
                {stats.conventionsMissing}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <CalendarCheck2 className="w-4 h-4 text-sky-400" /> Jurnale ore săptămâna curentă:
              </span>
              <span className="font-bold text-white">
                {stats.workLogsThisWeek}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-sky-500/15 text-[11px] text-slate-500">
            Modulul de generare convenții PDF va fi activ în Partea 2B.
          </div>
        </div>
      </div>

      {/* ── Tabel Plasamente & Gestiune Gale-Shapley ────────────────────────── */}
      <PlacementsTable placements={recentPlacements} />
    </div>
  );
}
