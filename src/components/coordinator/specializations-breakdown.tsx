"use client";

import React, { useState } from "react";
import { SpecializationStat, formatEngineeringDomain } from "@/lib/specializations";
import { EngineeringDomain } from "@prisma/client";
import {
  GraduationCap,
  Layers,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Filter,
  RotateCcw,
  BookOpen,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface SpecializationsBreakdownProps {
  breakdown: SpecializationStat[];
  selectedSpecialization: string;
  onSelectSpecialization: (specialization: string) => void;
}

export function SpecializationsBreakdown({
  breakdown,
  selectedSpecialization,
  onSelectSpecialization,
}: SpecializationsBreakdownProps) {
  const [showAllSpecs, setShowAllSpecs] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<string>("ALL");

  const activeSpecsCount = breakdown.filter((s) => s.totalEligible > 0).length;
  const totalEligibleAll = breakdown.reduce((acc, s) => acc + s.totalEligible, 0);
  const totalPlacedAll = breakdown.reduce((acc, s) => acc + s.placedCount, 0);
  const totalUnplacedAll = breakdown.reduce((acc, s) => acc + s.unplacedCount, 0);

  // Filtrare listă afișată
  const displayedSpecs = breakdown.filter((item) => {
    // Filtru studenți înscriși (dacă nu e bifat showAllSpecs și avem măcar o specializare cu studenți)
    if (!showAllSpecs && activeSpecsCount > 0 && item.totalEligible === 0) {
      return false;
    }
    // Filtru domeniu
    if (selectedDomain !== "ALL" && item.domain !== selectedDomain) {
      return false;
    }
    return true;
  });

  // Sortare: cele cu înscriși descrescător, apoi alfabetic
  const sortedSpecs = [...displayedSpecs].sort((a, b) => {
    if (b.totalEligible !== a.totalEligible) {
      return b.totalEligible - a.totalEligible;
    }
    return a.name.localeCompare(b.name);
  });

  const domainsList: { key: string; label: string }[] = [
    { key: "ALL", label: "Toate Domeniile" },
    { key: "COMPUTER_SCIENCE_IT", label: "Calculatoare & IT" },
    { key: "ELECTRONICS_TELECOM", label: "Electronică & Telecom" },
    { key: "ROBOTICS_MECHATRONICS", label: "Robotică & Mecatronică" },
    { key: "INDUSTRIAL_MANAGEMENT", label: "Inginerie Industrială" },
    { key: "GENERAL_ENGINEERING", label: "Inginerie Generală" },
  ];

  const handleRowClick = (specName: string) => {
    if (selectedSpecialization === specName) {
      onSelectSpecialization("ALL");
    } else {
      onSelectSpecialization(specName);
      // Derulare lină către tabelul de plasamente
      const tableElem = document.getElementById("placements-table-section");
      if (tableElem) {
        tableElem.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden transition-all">
      {/* ── Antet Panou Defalcare ─────────────────────────────────────────── */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Layers className="w-3.5 h-3.5" /> Analiză Academică
            </span>
            <span className="text-xs text-slate-400">·</span>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              13 Programe de Studii Facultatea de Inginerie
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            Distribuție & Statistică pe Specializări
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitorizare comparativă a cererii de practică și a ratei de alocare Gale-Shapley per program de licență.
          </p>
        </div>

        {/* Butoane Filtrare & Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector Domeniu */}
          <div className="relative inline-block text-left">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {domainsList.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Toate vs Doar cu Înscriși */}
          <button
            onClick={() => setShowAllSpecs(!showAllSpecs)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              showAllSpecs
                ? "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {showAllSpecs ? "Toate (13)" : `Doar Active (${activeSpecsCount})`}
            </span>
          </button>

          {/* Reset Filtru Specializare activ */}
          {selectedSpecialization !== "ALL" && (
            <button
              onClick={() => onSelectSpecialization("ALL")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetează filtru ({selectedSpecialization})</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Mini-Sumar Sintetic ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 divide-x divide-slate-200/80 dark:divide-slate-800 text-center py-2.5 px-2">
        <div className="p-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Secții cu Înscriși
          </div>
          <div className="text-base font-extrabold text-slate-900 dark:text-white">
            {activeSpecsCount} <span className="text-xs font-normal text-slate-400">/ 13</span>
          </div>
        </div>
        <div className="p-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Înscriși
          </div>
          <div className="text-base font-extrabold text-blue-600 dark:text-blue-400">
            {totalEligibleAll}
          </div>
        </div>
        <div className="p-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Total Plasați
          </div>
          <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
            {totalPlacedAll}
          </div>
        </div>
        <div className="p-1">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Rămași Nealocați
          </div>
          <div className={`text-base font-extrabold ${totalUnplacedAll > 0 ? "text-rose-600 dark:text-rose-400" : "text-slate-700 dark:text-slate-300"}`}>
            {totalUnplacedAll}
          </div>
        </div>
      </div>

      {/* ── Tabel / Vizualizare Specializări ──────────────────────────────── */}
      {sortedSpecs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
          Nu există nicio specializare conform filtrelor selectate.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Program Studii (Specializare)</th>
                <th className="py-3 px-4">Domeniu Ingineresc</th>
                <th className="py-3 px-4 text-center">Înscriși</th>
                <th className="py-3 px-4 text-center">Plasați (Confirmat / În Așteptare)</th>
                <th className="py-3 px-4 text-center">Fără Loc</th>
                <th className="py-3 px-4 min-w-[140px]">Rată Plasare</th>
                <th className="py-3 px-4 text-right">Filtrare</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedSpecs.map((spec) => {
                const isSelected = selectedSpecialization === spec.name;
                const hasUnplaced = spec.unplacedCount > 0;

                return (
                  <tr
                    key={spec.name}
                    onClick={() => handleRowClick(spec.name)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-indigo-50/80 dark:bg-indigo-950/40 font-medium"
                        : "hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    {/* Nume & Abreviere */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {spec.abbreviation && (
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {spec.abbreviation}
                          </span>
                        )}
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {spec.name}
                        </span>
                      </div>
                    </td>

                    {/* Domeniu Ingineresc */}
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3 text-slate-400" />
                        {formatEngineeringDomain(spec.domain)}
                      </span>
                    </td>

                    {/* Înscriși */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          spec.totalEligible > 0
                            ? "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                            : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                        }`}
                      >
                        {spec.totalEligible}
                      </span>
                    </td>

                    {/* Plasați (Breakdown) */}
                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold">
                        <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-0.5" title="Confirmate">
                          <CheckCircle2 className="w-3 h-3 inline" /> {spec.confirmedCount}
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">/</span>
                        <span className="text-amber-700 dark:text-amber-400 flex items-center gap-0.5" title="În Așteptare">
                          <Clock className="w-3 h-3 inline" /> {spec.pendingCount}
                        </span>
                      </div>
                    </td>

                    {/* Fără Loc */}
                    <td className="py-3 px-4 text-center">
                      {hasUnplaced ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          <AlertTriangle className="w-3 h-3" />
                          {spec.unplacedCount}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">0</span>
                      )}
                    </td>

                    {/* Rată Plasare cu Bară Progres */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            {spec.successRate}%
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {spec.placedCount}/{spec.totalEligible}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              spec.successRate >= 80
                                ? "bg-emerald-500"
                                : spec.successRate >= 40
                                ? "bg-blue-500"
                                : spec.successRate > 0
                                ? "bg-amber-500"
                                : "bg-slate-300 dark:bg-slate-700"
                            }`}
                            style={{ width: `${Math.min(100, spec.successRate)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Buton Filtrare */}
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(spec.name);
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300"
                        }`}
                      >
                        <span>{isSelected ? "Activat" : "Filtrează"}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Subsol cu Notă Informativă ────────────────────────────────────── */}
      <div className="p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            Faceți clic pe oricare specializare pentru a izola automat studenții în tabelul de plasamente de mai jos.
          </span>
        </div>
        {selectedSpecialization !== "ALL" && (
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">
            Filtru curent: {selectedSpecialization}
          </span>
        )}
      </div>
    </div>
  );
}
