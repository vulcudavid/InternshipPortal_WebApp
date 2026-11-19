"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  confirmPlacement,
  confirmAllPlacements,
  cancelPlacementByCoordinator,
} from "@/app/actions/coordinator";
import {
  Check,
  X,
  FileText,
  Lock,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import { PlacementStatus } from "@prisma/client";

export interface PlacementItem {
  id: string;
  status: PlacementStatus;
  matchedAt: Date;
  confirmedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  student: {
    id: string;
    specialization: string;
    studyYear: number;
    group: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  offer: {
    id: string;
    title: string;
    company: {
      companyName: string;
    };
  };
}

interface PlacementsTableProps {
  placements: PlacementItem[];
  selectedSpecialization?: string;
  onSelectSpecialization?: (spec: string) => void;
}

export function PlacementsTable({
  placements,
  selectedSpecialization,
  onSelectSpecialization,
}: PlacementsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Stare internă dacă nu este controlată din exterior
  const [internalSpec, setInternalSpec] = useState<string>("ALL");
  const activeSpecialization = selectedSpecialization ?? internalSpec;
  const setActiveSpecialization = onSelectSpecialization ?? setInternalSpec;

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  // Extragere listă unică de specializări din plasamentele existente
  const availableSpecializations = useMemo(() => {
    const specs = Array.from(
      new Set(placements.map((p) => p.student.specialization).filter(Boolean))
    );
    return specs.sort();
  }, [placements]);

  // Filtrare combinată (Specializare + Status + Text căutare)
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      // Filtru specializare
      if (activeSpecialization !== "ALL") {
        if (p.student.specialization.toLowerCase() !== activeSpecialization.toLowerCase()) {
          return false;
        }
      }

      // Filtru status
      if (statusFilter !== "ALL") {
        if (p.status !== statusFilter) {
          return false;
        }
      }

      // Căutare după nume, grupă, firmă sau titlu ofertă
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${p.student.user.firstName} ${p.student.user.lastName}`.toLowerCase();
        const group = (p.student.group || "").toLowerCase();
        const company = (p.offer.company.companyName || "").toLowerCase();
        const title = (p.offer.title || "").toLowerCase();
        const spec = (p.student.specialization || "").toLowerCase();

        if (
          !fullName.includes(q) &&
          !group.includes(q) &&
          !company.includes(q) &&
          !title.includes(q) &&
          !spec.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [placements, activeSpecialization, statusFilter, searchQuery]);

  const pendingCount = filteredPlacements.filter(
    (p) => p.status === PlacementStatus.PENDING_CONFIRMATION
  ).length;

  const handleConfirm = (placementId: string) => {
    setActiveActionId(placementId);
    startTransition(async () => {
      try {
        await confirmPlacement(placementId);
      } catch (err: any) {
        alert(err.message || "Eroare la confirmarea plasamentului.");
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const handleConfirmAll = () => {
    if (
      !window.confirm(
        `Confirmați toate cele ${pendingCount} plasamente aflate în așteptare?`
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await confirmAllPlacements();
        alert(`Au fost confirmate cu succes ${res.confirmed} plasamente.`);
      } catch (err: any) {
        alert(err.message || "Eroare la confirmarea în masă a plasamentelor.");
      }
    });
  };

  const handleCancel = (placementId: string) => {
    const reason = window.prompt("Introduceți motivul anulării (opțional):");
    if (reason === null) return; // user cancelled prompt

    setActiveActionId(placementId);
    startTransition(async () => {
      try {
        await cancelPlacementByCoordinator(placementId, reason);
      } catch (err: any) {
        alert(err.message || "Eroare la anularea plasamentului.");
      } finally {
        setActiveActionId(null);
      }
    });
  };

  const handleResetFilters = () => {
    setActiveSpecialization("ALL");
    setStatusFilter("ALL");
    setSearchQuery("");
    setCurrentPage(1);
  };

  const isAnyFilterActive =
    activeSpecialization !== "ALL" || statusFilter !== "ALL" || searchQuery.trim() !== "";

  const totalPages = Math.max(1, Math.ceil(filteredPlacements.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const displayedPlacements = filteredPlacements.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const getStatusBadge = (status: PlacementStatus, cancelReason?: string | null) => {
    switch (status) {
      case PlacementStatus.CONFIRMED:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle className="w-3 h-3" /> Confirmat
          </span>
        );
      case PlacementStatus.PENDING_CONFIRMATION:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" /> În Așteptare
          </span>
        );
      case PlacementStatus.REFUSED_BY_STUDENT:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" /> Refuz Student
          </span>
        );
      case PlacementStatus.CANCELLED_BY_COMPANY:
        return (
          <span
            title={cancelReason || undefined}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
          >
            <X className="w-3 h-3" /> Anulat Firmă
          </span>
        );
      case PlacementStatus.CANCELLED_BY_COORDINATOR:
        return (
          <span
            title={cancelReason || undefined}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
          >
            <X className="w-3 h-3" /> Anulat Coordonator
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div
      id="placements-table-section"
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden"
    >
      {/* ── Antet Principal Tabel & Buton Confirmare În Masă ───────────────── */}
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Rezultate Plasamente & Alocări
            </h2>
            {activeSpecialization !== "ALL" && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {activeSpecialization}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Afișate {filteredPlacements.length} din {placements.length} plasamente
            {activeSpecialization !== "ALL" && ` · Filtru: ${activeSpecialization}`}
            {pendingCount > 0 && ` · ${pendingCount} în așteptare de confirmare`}
          </p>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleConfirmAll}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Confirmă Toate ({pendingCount})</span>
          </button>
        )}
      </div>

      {/* ── Bară de Filtrare & Căutare Rapidă ──────────────────────────────── */}
      <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          {/* Căutare Text */}
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Caută student, grupă, firmă sau poziție..."
              className="w-full text-xs pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Selector Specializare */}
          <div className="relative">
            <select
              value={activeSpecialization}
              onChange={(e) => {
                setActiveSpecialization(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Toate Specializările ({placements.length})</option>
              {availableSpecializations.map((spec) => {
                const count = placements.filter(
                  (p) => p.student.specialization.toLowerCase() === spec.toLowerCase()
                ).length;
                return (
                  <option key={spec} value={spec}>
                    {spec} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Selector Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="ALL">Toate Stările</option>
              <option value={PlacementStatus.PENDING_CONFIRMATION}>În Așteptare</option>
              <option value={PlacementStatus.CONFIRMED}>Confirmat</option>
              <option value={PlacementStatus.CANCELLED_BY_COMPANY}>Anulat Firmă</option>
              <option value={PlacementStatus.CANCELLED_BY_COORDINATOR}>Anulat Coordonator</option>
              <option value={PlacementStatus.REFUSED_BY_STUDENT}>Refuz Student</option>
            </select>
          </div>
        </div>

        {/* Buton Resetare Filtre */}
        {isAnyFilterActive && (
          <button
            onClick={handleResetFilters}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Resetează filtrele</span>
          </button>
        )}
      </div>

      {/* ── Conținut Tabel ────────────────────────────────────────────────── */}
      {filteredPlacements.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Niciun plasament găsit
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {isAnyFilterActive
              ? "Niciun rezultat nu corespunde filtrelor selectate. Încercați să resetați căutarea sau filtrul de specializare."
              : "După ce rulați Gale-Shapley, rezultatele vor apărea aici."}
          </p>
          {isAnyFilterActive && (
            <button
              onClick={handleResetFilters}
              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 text-xs font-semibold rounded-lg hover:bg-indigo-100 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resetează toate filtrele</span>
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs uppercase font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Specializare & An</th>
                <th className="py-3.5 px-4">Companie & Poziție</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Data Alocării</th>
                <th className="py-3.5 px-4 text-right">Acțiuni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedPlacements.map((p) => {
                const isItemLoading = isPending && activeActionId === p.id;
                const isConfirmed = p.status === PlacementStatus.CONFIRMED;
                const isPendingConf = p.status === PlacementStatus.PENDING_CONFIRMATION;

                return (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {p.student.user.firstName} {p.student.user.lastName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Grupa {p.student.group}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                        {p.student.specialization}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Anul {p.student.studyYear}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div
                        className="font-medium text-slate-900 dark:text-white truncate"
                        title={p.offer.company.companyName}
                      >
                        {p.offer.company.companyName}
                      </div>
                      <div
                        className="text-xs text-slate-500 dark:text-slate-400 truncate"
                        title={p.offer.title}
                      >
                        {p.offer.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getStatusBadge(p.status, p.cancelReason)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(p.matchedAt).toLocaleDateString("ro-RO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isPendingConf && (
                          <button
                            onClick={() => handleConfirm(p.id)}
                            disabled={isPending}
                            title="Confirmă plasamentul"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer"
                          >
                            {isItemLoading ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Confirmă</span>
                          </button>
                        )}

                        {(isPendingConf || isConfirmed) && (
                          <button
                            onClick={() => handleCancel(p.id)}
                            disabled={isPending}
                            title="Anulează plasamentul"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 rounded-md border border-rose-200 dark:border-rose-800 transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                            <span>Anulează</span>
                          </button>
                        )}

                        {isConfirmed && (
                          <span
                            title="Plasament confirmat (protejat la re-rulări Gale-Shapley)"
                            className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded border border-slate-200 dark:border-slate-700 cursor-help"
                          >
                            <Lock className="w-3 h-3" /> Protejat
                          </span>
                        )}

                        {/* Convenție button disabled conform plan Partea 2B */}
                        <button
                          disabled
                          title="Generarea convenției PDF va fi disponibilă în Partea 2B"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500 rounded border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                        >
                          <FileText className="w-3 h-3" /> Convenție
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Pagina {safeCurrentPage} din {totalPages} ({filteredPlacements.length} rezultate)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safeCurrentPage === 1}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
