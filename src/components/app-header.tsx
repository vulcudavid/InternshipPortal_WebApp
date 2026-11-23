import React from "react";
import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export interface HeaderUser {
  firstName: string;
  lastName: string;
  role: string;
}

export interface AppHeaderProps {
  currentUser?: HeaderUser | null;
}

export function AppHeader({ currentUser }: AppHeaderProps) {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return {
          label: "Student",
          classes: "bg-sky-500/15 text-sky-300 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]",
        };
      case "COMPANY_TUTOR":
        return {
          label: "Firmă / Tutore",
          classes: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]",
        };
      case "COORDINATOR":
        return {
          label: "Coordonator",
          classes: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)]",
        };
      case "ADMIN":
        return {
          label: "Administrator",
          classes: "bg-amber-500/15 text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
        };
      default:
        return {
          label: role,
          classes: "bg-slate-700/30 text-slate-300 border-slate-600/30",
        };
    }
  };

  return (
    <nav className="border-b border-sky-500/20 bg-[#070D19]/85 backdrop-blur-xl sticky top-0 z-50 shadow-[0_4px_30px_rgba(4,8,18,0.6)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-500 to-indigo-500 rounded-xl blur-xs opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-slate-950 flex items-center justify-center font-black text-lg tracking-wider border border-sky-200/50 shadow-[0_0_15px_rgba(14,165,233,0.45)]">
              P14
            </div>
          </div>
          <div>
            <span className="font-extrabold text-white text-sm sm:text-base leading-tight block tracking-tight">
              Portal Practică Inginerie
            </span>
            <span className="text-[11px] text-sky-400/80 block leading-tight font-medium tracking-wide">
              Universitatea „Lucian Blaga” din Sibiu
            </span>
          </div>
        </div>

        {/* User Info / Status & Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white tracking-wide">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                {(() => {
                  const badge = getRoleBadge(currentUser.role);
                  return (
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.classes}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <form action={logoutAction}>
                <button
                  type="submit"
                  title="Deconectare din sesiune"
                  className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-rose-500/30 bg-rose-950/20 hover:bg-rose-900/40 text-rose-300 hover:text-rose-100 transition duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-[0_0_12px_rgba(244,63,94,0.15)] active:scale-95"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  <span className="hidden sm:inline">Deconectare</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-sky-950/40 text-sky-300 border border-sky-500/30 rounded-full text-xs font-semibold shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400 shadow-[0_0_8px_#38bdf8]"></span>
                </span>
                <span className="tracking-wide">Sistem Cyber-Engineering Activ</span>
              </span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

/**
 * Componentă dedicată de Header pentru rolul de Administrator / Back-Office,
 * conform cerințelor de arhitectură ale portalului.
 */
export function AdminHeader(props: AppHeaderProps) {
  return <AppHeader {...props} />;
}
