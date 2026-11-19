"use client";

import React, { useState } from "react";
import { CoordinatorDashboardData } from "@/app/actions/coordinator";
import { StatsCard } from "./stats-card";
import { SpecializationsBreakdown } from "./specializations-breakdown";
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
  const { stats, specializationBreakdown, recentPlacements } = data;
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("ALL");

  const placementRate =
    stats.totalEligibleStudents > 0
      ? Math.round((stats.totalConfirmed / stats.totalEligibleStudents) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Topbar / Header Acțiuni Coordonator ─────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <GraduationCap className="w-3.5 h-3.5" /> Coordonator Academic
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Facultatea de Inginerie ULBS
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
            Panou Coordonare Practică & Repartizare Stabilă
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
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
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Există {stats.totalPending} plasamente nou generate în așteptarea confirmării
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300/90 mt-0.5">
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
        <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Rata de Plasare Confirmată
              </span>
              <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400">
                {placementRate}%
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 mt-3 overflow-hidden">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, placementRate)}%` }}
              />
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              {stats.totalConfirmed} Confirmate
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              {stats.totalPending} În așteptare
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              {stats.totalUnplaced} Nealocați
            </span>
          </div>
        </div>

        {/* Card Indicatori Convenții & Jurnale */}
        <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Documente & Monitorizare
          </span>
          <div className="space-y-3 mt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <FileWarning className="w-4 h-4 text-amber-500" /> Convenții nesemnate:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {stats.conventionsMissing}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 font-medium">
                <CalendarCheck2 className="w-4 h-4 text-blue-500" /> Jurnale ore săptămâna curentă:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {stats.workLogsThisWeek}
              </span>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
            Modulul de generare convenții PDF va fi activ în Partea 2B.
          </div>
        </div>
      </div>

      {/* ── Defalcare & Statistică pe Specializări ULBS ───────────────────── */}
      <SpecializationsBreakdown
        breakdown={specializationBreakdown}
        selectedSpecialization={selectedSpecialization}
        onSelectSpecialization={setSelectedSpecialization}
      />

      {/* ── Tabel Plasamente & Gestiune Gale-Shapley (cu Filtrare Sincronizată) */}
      <PlacementsTable
        placements={recentPlacements}
        selectedSpecialization={selectedSpecialization}
        onSelectSpecialization={setSelectedSpecialization}
      />
    </div>
  );
}
