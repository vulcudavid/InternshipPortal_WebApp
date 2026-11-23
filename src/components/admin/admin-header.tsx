import React from "react";
import { logoutAction } from "@/app/actions/auth";
import { ShieldCheck, LogOut } from "lucide-react";

interface AdminHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" /> ADMIN
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Facultatea de Inginerie ULBS
          </span>
        </div>
        <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white mt-1.5 tracking-tight">
          Panou de Administrare Sistem
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Conectat ca {user.firstName} {user.lastName} ({user.email})
        </p>
      </div>

      <div className="flex items-center gap-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Deconectare</span>
          </button>
        </form>
      </div>
    </div>
  );
}
