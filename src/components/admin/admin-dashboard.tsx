"use client";

import React, { useState } from "react";
import {
  Terminal,
  ShieldCheck,
  Users,
  Building2,
  Briefcase,
  Activity,
  Server,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Cpu
} from "lucide-react";

interface AdminDashboardProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"AUDIT" | "COMPANIES" | "SYSTEM">("AUDIT");

  const auditLogs = [
    { id: "log-1", timestamp: "2026-11-23 23:15:02", event: "GALE_SHAPLEY_TRIGGERED", actor: "Mihai Ionescu (Coordonator)", status: "SUCCESS", detail: "Rulare matching Many-to-One: 128 studenți evaluați" },
    { id: "log-2", timestamp: "2026-11-23 22:58:14", event: "GDPR_PRIVACY_GATE_QUERY", actor: "recruitment@continental-sibiu.com", status: "ALLOWED", detail: "Acces CV autorizat pentru Alexandru Radu (StudentPreference existent)" },
    { id: "log-3", timestamp: "2026-11-23 21:40:22", event: "STUDENT_PREFERENCES_UPDATE", actor: "Alexandru Radu (Student)", status: "SUCCESS", detail: "Actualizare clasament preferințe: 3 opțiuni salvate" },
    { id: "log-4", timestamp: "2026-11-23 20:10:05", event: "OFFER_UPSERT", actor: "Elena Popa (Tutore)", status: "SUCCESS", detail: "Publicare ofertă: Software Engineering Intern (3 locuri)" },
    { id: "log-5", timestamp: "2026-11-23 18:30:11", event: "SYSTEM_BACKUP_SNAPSHOT", actor: "Daemon System Root", status: "SUCCESS", detail: "Snapshot securizat PostgreSQL efectuat" },
  ];

  const systemCompanies = [
    { name: "Continental Automotive Sibiu", cui: "RO12345678", offers: 3, studentsMatched: 3, status: "Partener Verificat" },
    { name: "Marquardt Schaltsysteme SCS", cui: "RO18293041", offers: 2, studentsMatched: 2, status: "Partener Verificat" },
    { name: "Siemens Industry Software", cui: "RO99281726", offers: 4, studentsMatched: 4, status: "Partener Verificat" },
    { name: "NTT DATA Romania", cui: "RO33881122", offers: 2, studentsMatched: 1, status: "Partener Verificat" },
  ];

  const filteredLogs = auditLogs.filter(
    (l) =>
      l.event.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.detail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* ── Banner Root Administrator ─────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-950/60 via-[#0B1221] to-sky-950/60 rounded-2xl p-6 text-white shadow-[0_0_35px_rgba(245,158,11,0.1)] border border-amber-500/30 backdrop-blur-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#070D19] border border-amber-400/40 text-amber-400 flex items-center justify-center font-bold text-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
              <Terminal className="w-8 h-8" />
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-400/30 mb-1">
                Consolă de Administrare Sistem • Root ULBS
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white">
                Bună ziua, Administrator {user.firstName} {user.lastName}!
              </h2>
              <p className="text-xs text-slate-400">
                Sistem P14 • Monitorizare integritate Gale-Shapley, GDPR Privacy Gate și securitate enterprise
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-950/60 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Sistem 100% Operațional
            </span>
          </div>
        </div>
      </div>

      {/* ── 4 Carduri KPI Administrative ─────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] border-t-4 border-t-sky-400">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Studenți</p>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">128</p>
          <p className="text-[11px] text-emerald-400 mt-1 font-medium">85% cu preferințe exprimate</p>
        </div>

        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] border-t-4 border-t-cyan-400">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Companii Partenere</p>
            <Building2 className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">18</p>
          <p className="text-[11px] text-cyan-300 mt-1 font-medium">Toate validate juridic</p>
        </div>

        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] border-t-4 border-t-indigo-400">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Locuri Ofertate</p>
            <Briefcase className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white mt-2">145</p>
          <p className="text-[11px] text-indigo-300 mt-1 font-medium">Capacitate excedentară</p>
        </div>

        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] border-t-4 border-t-emerald-400">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Privacy Gate</p>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">100%</p>
          <p className="text-[11px] text-emerald-300 mt-1 font-medium">GDPR Strict Enforced</p>
        </div>
      </div>

      {/* ── Bara de Tab-uri Administrative ─────────────────────────────── */}
      <div className="flex bg-[#070D19]/80 backdrop-blur-xl border border-sky-500/20 p-1.5 rounded-2xl gap-1 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab("AUDIT")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "AUDIT"
              ? "bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Audit Log Sistem & Evenimente</span>
        </button>

        <button
          onClick={() => setActiveTab("COMPANIES")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "COMPANIES"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Building2 className="w-4 h-4 text-sky-400" />
          <span>Registru Companii Partenere ({systemCompanies.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("SYSTEM")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "SYSTEM"
              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Infrastructură & Diagnostic</span>
        </button>
      </div>

      {/* ── Tab 1: Audit Log ─────────────────────────────── */}
      {activeTab === "AUDIT" && (
        <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                Jurnal Securizat de Auditare (Audit Trail)
              </h3>
              <p className="text-xs text-slate-400">
                Toate acțiunile critice (Gale-Shapley, acces CV, modificări de preferințe) sunt înregistrate imutabil.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrează log-uri..."
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-sky-500/30 bg-[#070D19] text-white pl-8 placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070D19]/90 text-sky-300 uppercase font-semibold border-b border-sky-500/20">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Eveniment</th>
                  <th className="py-3 px-4">Utilizator / Actor</th>
                  <th className="py-3 px-4">Detalii Acțiune</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-500/10">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-sky-500/5 transition">
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="py-3 px-4 font-bold text-white font-mono">{log.event}</td>
                    <td className="py-3 px-4 text-slate-300">{log.actor}</td>
                    <td className="py-3 px-4 text-slate-300 max-w-md truncate">{log.detail}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab 2: Registru Companii ─────────────────────────────── */}
      {activeTab === "COMPANIES" && (
        <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            Companii Partenere în Sistemul P14
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {systemCompanies.map((c) => (
              <div key={c.name} className="p-4 bg-[#070D19]/80 border border-sky-500/20 rounded-xl space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <span className="text-[11px] font-mono text-sky-300/80">CUI: {c.cui}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-semibold">
                    {c.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 border-t border-sky-500/15">
                  <span>Oferte active: <strong className="text-white">{c.offers}</strong></span>
                  <span>Studenți alocați: <strong className="text-white">{c.studentsMatched}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tab 3: Sistem & Infrastructură ─────────────────────────────── */}
      {activeTab === "SYSTEM" && (
        <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-5 space-y-4">
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            Parametri de Execuție & Integritate Sistem
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#070D19]/80 rounded-xl border border-sky-500/20 space-y-1">
              <span className="text-slate-400">Motor Algoritmic:</span>
              <p className="font-bold text-white text-sm">Gale-Shapley (Deferred Acceptance)</p>
              <p className="text-[11px] text-emerald-400 font-mono">Status: OPTIMIZED (O(N*M))</p>
            </div>
            <div className="p-4 bg-[#070D19]/80 rounded-xl border border-sky-500/20 space-y-1">
              <span className="text-slate-400">Modul Privacy Gate:</span>
              <p className="font-bold text-white text-sm">GDPR Exclusivity Policy</p>
              <p className="text-[11px] text-emerald-400 font-mono">Status: ENFORCED (Zero-Leak)</p>
            </div>
            <div className="p-4 bg-[#070D19]/80 rounded-xl border border-sky-500/20 space-y-1">
              <span className="text-slate-400">Bază de Date:</span>
              <p className="font-bold text-white text-sm">PostgreSQL 16 (Prisma ORM)</p>
              <p className="text-[11px] text-sky-400 font-mono">Conexiuni Active: OK</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
