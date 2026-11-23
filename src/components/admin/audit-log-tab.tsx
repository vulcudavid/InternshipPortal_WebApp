"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileText,
  Filter,
  RefreshCw,
  Clock,
  ShieldCheck,
  User,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface AuditLogItem {
  id: string;
  actorId: string;
  actionType: string;
  targetEntity: string;
  details: any;
  timestamp: string;
  actor: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

interface Props {
  onNotify: (msg: string, type: "success" | "error") => void;
}

export function AuditLogTab({ onNotify }: Props) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url =
        actionFilter === "ALL"
          ? "/api/admin/audit-logs"
          : `/api/admin/audit-logs?actionType=${actionFilter}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Nu s-a putut prelua jurnalul de audit.");
      }
      const data = await res.json();
      setLogs(data.auditLogs || []);
    } catch (err: any) {
      onNotify(err.message || "Eroare la preluarea logurilor de audit.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case "COMPANY_APPROVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> Aprobare Firmă
          </span>
        );
      case "COMPANY_REJECT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Respingere Firmă
          </span>
        );
      case "OFFER_WITHDRAW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" /> Retragere Ofertă (Twist P14)
          </span>
        );
      case "OFFER_ACTIVATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Activare Ofertă
          </span>
        );
      case "SETTINGS_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
            <Sliders className="w-3 h-3" /> Reguli Practică
          </span>
        );
      case "GDPR_ANONYMIZE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            Anonimizare GDPR
          </span>
        );
      case "USER_ROLE_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Schimbare Rol
          </span>
        );
      case "USER_STATUS_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Activare/Dezactivare
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header Secțiune */}
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-600" /> Jurnal de Audit & Securitate (Audit Log)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Înregistrare cronologică completă a tuturor acțiunilor critice efectuate în sistem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Action Type */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none pr-2 cursor-pointer"
              >
                <option value="ALL">Toate Acțiunile</option>
                <option value="COMPANY_APPROVE">Aprobare Firmă</option>
                <option value="COMPANY_REJECT">Respingere Firmă</option>
                <option value="OFFER_WITHDRAW">Retragere Ofertă</option>
                <option value="OFFER_ACTIVATE">Activare Ofertă</option>
                <option value="SETTINGS_UPDATE">Modificare Reguli</option>
                <option value="GDPR_ANONYMIZE">Anonimizare GDPR</option>
                <option value="USER_ROLE_CHANGE">Schimbare Rol</option>
                <option value="USER_STATUS_CHANGE">Stare Cont</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Reîmprospătează"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabel Audit */}
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Nicio înregistrare în jurnal
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {actionFilter !== "ALL"
                  ? "Nu există evenimente înregistrate pentru tipul de acțiune selectat."
                  : "Nu au fost executate încă acțiuni critice înregistrate în jurnalul de audit."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800 font-semibold">
                  <th className="py-3 px-4">Data & Ora</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Tip Acțiune</th>
                  <th className="py-3 px-4">Entitate Afectată</th>
                  <th className="py-3 px-4">Detalii Modificare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {logs.map((log) => {
                  const isExpanded = expandedId === log.id;
                  const formattedDate = new Date(log.timestamp).toLocaleString("ro-RO", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition align-top"
                    >
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {log.actor.firstName} {log.actor.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{log.actor.email}</div>
                      </td>
                      <td className="py-3.5 px-4">{getActionBadge(log.actionType)}</td>
                      <td className="py-3.5 px-4">
                        <code className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                          {log.targetEntity}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.details && (
                          <div>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                            >
                              <span>{isExpanded ? "Ascunde detalii" : "Vezi JSON detalii"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <pre className="mt-2 p-2.5 bg-slate-900 text-slate-100 rounded-lg text-[10px] font-mono overflow-x-auto max-w-md shadow-xs">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
