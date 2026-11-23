import { 
  GraduationCap, 
  Building2, 
  ShieldCheck, 
  FileText, 
  Clock, 
  Sparkles, 
  Users, 
  Calendar, 
  CheckCircle2, 
  Lock,
  Terminal,
  Server
} from "lucide-react";
import { UserRole } from "@prisma/client";

interface Props {
  role: UserRole;
  userName: string;
}

export function RoleDashboardSkeleton({ role, userName }: Props) {
  if (role === "STUDENT") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Banner Profil Student */}
        <div className="bg-gradient-to-r from-sky-600 via-blue-700 to-indigo-900 rounded-2xl p-6 text-white shadow-[0_0_30px_rgba(14,165,233,0.2)] border border-sky-400/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-950/50 border border-sky-300/40 backdrop-blur flex items-center justify-center font-bold text-2xl text-sky-300 shadow-inner">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/20 text-sky-200 border border-sky-400/30 mb-1">
                  Profil Student • Anul 3 CTI
                </span>
                <h2 className="text-2xl font-bold tracking-tight">Bine ai venit, {userName}!</h2>
                <p className="text-xs text-sky-200/80">
                  Facultatea de Inginerie ULBS • Domeniu: Calculatoare și Tehnologia Informației
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-xl bg-sky-950/60 backdrop-blur border border-sky-400/30 text-xs font-medium flex items-center gap-1.5 text-sky-200 shadow-[0_0_15px_rgba(14,165,233,0.15)]">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                Scor mediu compatibilitate: 87%
              </span>
            </div>
          </div>
        </div>

        {/* Skeleton Grid Student */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coloana 1: Feed Oferte Recomandate */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                <Sparkles className="w-4 h-4 text-sky-400" />
                Oferte de Practică Recomandate (Matching Inteligent)
              </h3>
              <span className="text-xs text-slate-400">Ordonat după scorul de compatibilitate</span>
            </div>

            {/* Skeleton Card 1 (Continental) */}
            <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">Continental Automotive Sibiu</span>
                  <h4 className="font-bold text-white text-base">Software Engineering Intern - Connected Mobility</h4>
                  <p className="text-xs text-slate-400 mt-1">Sibiu • Hibrid • 3 locuri disponibile • Perioadă: Iul - Sep 2026</p>
                </div>
                <span className="px-3 py-1 bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold">
                  87% Compatibil
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-2">
                <span className="px-2 py-0.5 bg-sky-950/60 text-sky-300 border border-sky-500/30 rounded text-xs">TypeScript</span>
                <span className="px-2 py-0.5 bg-sky-950/60 text-sky-300 border border-sky-500/30 rounded text-xs">React</span>
                <span className="px-2 py-0.5 bg-sky-950/60 text-sky-300 border border-sky-500/30 rounded text-xs">Docker</span>
                <span className="px-2 py-0.5 bg-slate-800/80 text-slate-300 rounded text-xs">Git / GitHub</span>
              </div>
              <div className="pt-2 flex items-center justify-between border-t border-sky-500/15">
                <span className="text-xs text-slate-400">Tutore: Elena Popa (Lead Software Architect)</span>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-24 bg-slate-800/60 animate-pulse rounded-lg"></div>
                  <div className="h-8 w-28 bg-sky-500/30 animate-pulse rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Coloana 2: Stare Plasament & Jurnal Pontaj */}
          <div className="space-y-6">
            <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Stare Plasament & Convenție PDF
              </h3>
              <div className="p-3 bg-purple-950/40 rounded-xl border border-purple-500/30 text-xs text-purple-200 space-y-1">
                <p className="font-semibold">Algoritmul Gale-Shapley este în așteptare</p>
                <p className="text-purple-300/80">
                  Coordonatorul facultății va rula algoritmul la încheierea etapei de exprimare a preferințelor.
                </p>
              </div>
            </div>

            <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-3">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                Jurnal Săptămânal Pontaj
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Total ore validate:</span>
                  <span className="font-bold text-emerald-400">0 / 90 ore</span>
                </div>
                <div className="h-10 bg-[#070D19]/60 border border-dashed border-sky-500/20 rounded-xl flex items-center justify-center text-xs text-slate-400">
                  Modul activ după începerea stagiului
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (role === "COMPANY_TUTOR") {
    return (
      <div className="space-y-6 animate-fadeIn">
        {/* Banner Tutore Firmă */}
        <div className="bg-gradient-to-r from-cyan-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-[0_0_30px_rgba(6,182,212,0.2)] border border-cyan-500/30">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/50 border border-cyan-300/40 backdrop-blur flex items-center justify-center font-bold text-2xl text-cyan-300">
                <Building2 className="w-8 h-8" />
              </div>
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-200 border border-cyan-400/30 mb-1">
                  Panou Companie Parteneră • Tutore Desemnat
                </span>
                <h2 className="text-2xl font-bold tracking-tight">Bună ziua, {userName}!</h2>
                <p className="text-xs text-cyan-200/80">
                  Continental Automotive Sibiu • Gestionare oferte, interviuri și aplicanți
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // COORDINATOR / ADMIN
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Banner Panou Administrare */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-[#070D19] rounded-2xl p-6 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] border border-purple-500/30">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-950/60 border border-purple-400/40 backdrop-blur flex items-center justify-center font-bold text-2xl text-purple-300">
              {role === "ADMIN" ? <Terminal className="w-8 h-8 text-amber-400" /> : <ShieldCheck className="w-8 h-8 text-purple-300" />}
            </div>
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 mb-1">
                {role === "ADMIN" ? "Consolă de Administrare Sistem • Root ULBS" : "Panou de Administrare & Coordonare Practică"}
              </span>
              <h2 className="text-2xl font-bold tracking-tight">Bună ziua, {userName}!</h2>
              <p className="text-xs text-purple-200/80">
                Facultatea de Inginerie ULBS • Monitorizare stagiari, matching Gale-Shapley și configurare enterprise
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-4 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
          <p className="text-xs text-slate-400 font-medium">Studenți Înscriși</p>
          <p className="text-2xl font-bold text-white mt-1">128</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">85% cu preferințe exprimate</p>
        </div>
        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-4 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
          <p className="text-xs text-slate-400 font-medium">Companii Partenere</p>
          <p className="text-2xl font-bold text-white mt-1">18</p>
          <p className="text-[11px] text-sky-400 mt-0.5">Continental, Siemens, etc.</p>
        </div>
        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-4 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
          <p className="text-xs text-slate-400 font-medium">Total Locuri Ofertate</p>
          <p className="text-2xl font-bold text-white mt-1">145</p>
          <p className="text-[11px] text-purple-400 mt-0.5">Capacitate excedentară</p>
        </div>
        <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-4 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
          <p className="text-xs text-slate-400 font-medium">Convenții Emise</p>
          <p className="text-2xl font-bold text-white mt-1">0 / 128</p>
          <p className="text-[11px] text-amber-400 mt-0.5">Se emit după matching</p>
        </div>
      </div>

      {/* Centralizator */}
      <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 rounded-xl p-5 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-400" />
            Centralizator Studenți & Alocări
          </h3>
          <span className="text-xs text-slate-400">Filtrează după domeniu / an</span>
        </div>
        <div className="space-y-2">
          <div className="h-10 bg-slate-800/40 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-slate-800/30 rounded-lg animate-pulse"></div>
          <div className="h-10 bg-slate-800/30 rounded-lg animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}
