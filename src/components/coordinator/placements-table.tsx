"use client";

import React, { useState, useTransition } from "react";
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
}

export function PlacementsTable({ placements }: PlacementsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [activeActionId, setActiveActionId] = useState<string | null>(null);

  const pendingCount = placements.filter(
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

  const totalPages = Math.max(1, Math.ceil(placements.length / pageSize));
  const displayedPlacements = placements.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Rezultate Plasamente & Alocări
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total înregistrate: {placements.length} plasamente · {pendingCount} în așteptare de confirmare
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

      {placements.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Niciun plasament înregistrat încă
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            După ce studenții își confirmă preferințele și companiile își evaluează aplicanții,
            apăsați pe „Rulează Gale-Shapley” pentru a genera repartizarea stabilă.
          </p>
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
                      <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        {p.student.specialization}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Anul {p.student.studyYear}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 max-w-[220px]">
                      <div className="font-medium text-slate-900 dark:text-white truncate" title={p.offer.company.companyName}>
                        {p.offer.company.companyName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate" title={p.offer.title}>
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
                Pagina {currentPage} din {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
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
