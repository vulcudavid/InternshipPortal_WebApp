import React from "react";
import Image from "next/image";
import { logoutAction } from "@/app/actions/auth";
import { ShieldCheck, LogOut, Terminal } from "lucide-react";

interface AdminHeaderProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  return (
    <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl p-6 border border-sky-400/20 shadow-[0_0_30px_rgba(14,165,233,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="relative w-12 h-12 rounded-xl bg-[#070D19]/90 p-1.5 flex items-center justify-center border border-sky-400/30 shadow-[0_0_15px_rgba(14,165,233,0.25)] shrink-0">
          <Image
            src="/images/ulbs-shield.svg"
            alt="ULBS"
            width={40}
            height={40}
            className="w-full h-full object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> ADMIN ROOT
            </span>
            <span className="text-xs text-sky-500/40">·</span>
            <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
              <Terminal className="w-3 h-3 text-sky-400" />
              Facultatea de Inginerie ULBS
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white mt-1 tracking-tight">
            Panou de Administrare Sistem
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Sesiune securizată: <span className="text-sky-300 font-semibold">{user.firstName} {user.lastName}</span> ({user.email})
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <form action={logoutAction}>
          <button
            type="submit"
            className="px-3.5 py-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.15)] transition flex items-center gap-2 text-xs font-semibold cursor-pointer active:scale-95"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span>Deconectare</span>
          </button>
        </form>
      </div>
    </div>
  );
}
