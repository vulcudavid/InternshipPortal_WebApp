"use client";

import React, { useState, useEffect } from "react";
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-3 h-3" /> Aprobare Firmă
          </span>
        );
      case "COMPANY_REJECT":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            Respingere Firmă
          </span>
        );
      case "OFFER_WITHDRAW":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30 shadow-[0_0_10px_rgba(244,63,94,0.15)]">
            <AlertTriangle className="w-3 h-3" /> Retragere Ofertă (Realocare Minimală)
          </span>
        );
      case "OFFER_ACTIVATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]">
            Activare Ofertă
          </span>
        );
      case "SETTINGS_UPDATE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
            <Sliders className="w-3 h-3" /> Reguli Practică
          </span>
        );
      case "GDPR_ANONYMIZE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]">
            Anonimizare GDPR
          </span>
        );
      case "USER_ROLE_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.15)]">
            Schimbare Rol
          </span>
        );
      case "USER_STATUS_CHANGE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Activare/Dezactivare
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_30px_rgba(14,165,233,0.06)] overflow-hidden">
        {/* Header Secțiune */}
        <div className="p-5 border-b border-sky-500/20 bg-[#070D19]/50 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Jurnal de Audit & Securitate (Audit Log)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Înregistrare cronologică completă a tuturor acțiunilor critice efectuate în sistem.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Action Type */}
            <div className="flex items-center gap-1 bg-[#040812]/80 px-2.5 py-1.5 rounded-lg border border-sky-500/30 text-xs">
              <Filter className="w-3 h-3 text-slate-400 ml-1" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-white focus:outline-none pr-2 cursor-pointer"
              >
                <option value="ALL" className="bg-[#040812] text-white">Toate Acțiunile</option>
                <option value="COMPANY_APPROVE" className="bg-[#040812] text-white">Aprobare Firmă</option>
                <option value="COMPANY_REJECT" className="bg-[#040812] text-white">Respingere Firmă</option>
                <option value="OFFER_WITHDRAW" className="bg-[#040812] text-white">Retragere Ofertă</option>
                <option value="OFFER_ACTIVATE" className="bg-[#040812] text-white">Activare Ofertă</option>
                <option value="SETTINGS_UPDATE" className="bg-[#040812] text-white">Modificare Reguli</option>
                <option value="GDPR_ANONYMIZE" className="bg-[#040812] text-white">Anonimizare GDPR</option>
                <option value="USER_ROLE_CHANGE" className="bg-[#040812] text-white">Schimbare Rol</option>
                <option value="USER_STATUS_CHANGE" className="bg-[#040812] text-white">Stare Cont</option>
              </select>
            </div>

            <button
              onClick={fetchLogs}
              disabled={loading}
              title="Reîmprospătează"
              className="p-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Tabel Audit */}
        <div className="overflow-x-auto">
          {logs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-semibold text-slate-300">
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
                <tr className="bg-[#070D19]/80 text-sky-300/80 border-b border-sky-500/20 font-semibold tracking-wider uppercase text-[11px]">
                  <th className="py-3 px-4">Data & Ora</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Tip Acțiune</th>
                  <th className="py-3 px-4">Entitate Afectată</th>
                  <th className="py-3 px-4">Detalii Modificare</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-500/10">
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
                      className="hover:bg-sky-500/5 transition align-top"
                    >
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-sky-400" />
                          {log.actor.firstName} {log.actor.lastName}
                        </div>
                        <div className="text-[11px] text-slate-400">{log.actor.email}</div>
                      </td>
                      <td className="py-3.5 px-4">{getActionBadge(log.actionType)}</td>
                      <td className="py-3.5 px-4">
                        <code className="text-[11px] px-2 py-0.5 rounded bg-[#040812] text-sky-300 border border-sky-500/30 font-mono">
                          {log.targetEntity}
                        </code>
                      </td>
                      <td className="py-3.5 px-4">
                        {log.details && (
                          <div>
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold cursor-pointer"
                            >
                              <span>{isExpanded ? "Ascunde detalii" : "Vezi JSON detalii"}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>

                            {isExpanded && (
                              <pre className="mt-2 p-2.5 bg-[#040812] text-sky-300 border border-sky-500/30 rounded-lg text-[10px] font-mono overflow-x-auto max-w-md shadow-xs">
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
