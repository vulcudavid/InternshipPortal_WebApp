"use client";

import React, { useState } from "react";
import { AdminHeader } from "./admin-header";
import { CompaniesOffersTab } from "./companies-offers-tab";
import { UsersGdprTab } from "./users-gdpr-tab";
import { SettingsTab } from "./settings-tab";
import { AuditLogTab } from "./audit-log-tab";
import { Building2, Users, Sliders, FileText, CheckCircle2, AlertCircle, X } from "lucide-react";

interface AdminDashboardProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

type TabType = "companies-offers" | "users-gdpr" | "settings" | "audit-log";

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabType>("companies-offers");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  const showNotification = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* ── Topbar / Header Acțiuni Admin ───────────────────────────────────── */}
      <AdminHeader user={user} />

      {/* ── Toast Alert Banner ─────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 shadow-sm transition animate-in fade-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200"
              : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            {toast.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Selector Tab-uri Navigare ────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-1.5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab("companies-offers")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "companies-offers"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Firme & Oferte</span>
        </button>

        <button
          onClick={() => setActiveTab("users-gdpr")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "users-gdpr"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Utilizatori & GDPR</span>
        </button>

        <button
          onClick={() => setActiveTab("settings")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "settings"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Reguli Globale</span>
        </button>

        <button
          onClick={() => setActiveTab("audit-log")}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "audit-log"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Audit Log</span>
        </button>
      </div>

      {/* ── Conținut Tab Activ ──────────────────────────────────────────────── */}
      <div>
        {activeTab === "companies-offers" && (
          <CompaniesOffersTab onNotify={showNotification} />
        )}
        {activeTab === "users-gdpr" && (
          <UsersGdprTab onNotify={showNotification} />
        )}
        {activeTab === "settings" && (
          <SettingsTab onNotify={showNotification} />
        )}
        {activeTab === "audit-log" && (
          <AuditLogTab onNotify={showNotification} />
        )}
      </div>
    </div>
  );
}
