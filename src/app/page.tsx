import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AuthCard } from "@/components/auth-card";
import { AppHeader } from "@/components/app-header";
import { RoleDashboardSkeleton } from "@/components/role-dashboard-skeleton";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { CompanyDashboard } from "@/components/company/company-dashboard";
import { CoordinatorDashboard } from "@/components/coordinator/coordinator-dashboard";
import { getCoordinatorDashboardData } from "@/app/actions/coordinator";
import { sanitizeStudentProfileForCompany } from "@/lib/privacy";
import { 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  Sparkles,
  Cpu,
  Layers
} from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (currentUser && currentUser.role === UserRole.ADMIN) {
    redirect("/admin");
  }

  // 1. Date necesare pentru Dashboard Student (Partea 1A)
  let studentData = null;
  if (currentUser && currentUser.role === UserRole.STUDENT && currentUser.studentProfile) {
    const [availableTags, offers, preferences] = await Promise.all([
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, domain: true, isPredefined: true },
      }),
      prisma.internshipOffer.findMany({
        where: { status: "ACTIVE" },
        include: {
          company: {
            select: { id: true, companyName: true, city: true, website: true },
          },
          offerTags: {
            include: {
              tag: { select: { name: true, domain: true } },
            },
          },
          interviewSlots: {
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.studentPreference.findMany({
        where: { studentId: currentUser.studentProfile.id },
        include: {
          offer: {
            select: {
              id: true,
              title: true,
              location: true,
              slotsAvailable: true,
              company: { select: { companyName: true } },
            },
          },
        },
        orderBy: { rank: "asc" },
      }),
    ]);

    studentData = {
      availableTags,
      offers,
      preferences,
    };
  }

  // 2. Date necesare pentru Dashboard Companie / Tutore (Partea 1B)
  let companyData = null;
  if (currentUser && currentUser.role === UserRole.COMPANY_TUTOR && currentUser.companyProfile) {
    const [offers, availableTags, allRawStudents] = await Promise.all([
      prisma.internshipOffer.findMany({
        where: { companyId: currentUser.companyProfile.id },
        include: {
          offerTags: {
            include: { tag: true },
          },
          preferences: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                  tags: { include: { tag: true } },
                },
              },
            },
            orderBy: { rank: "asc" },
          },
          applicantRanks: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                  tags: { include: { tag: true } },
                },
              },
            },
            orderBy: { rank: "asc" },
          },
          interviewSlots: {
            include: {
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
            },
            orderBy: { startTime: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.tag.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, domain: true, isPredefined: true },
      }),
      prisma.studentProfile.findMany({
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          tags: { include: { tag: true } },
        },
      }),
    ]);

    // GDPR Privacy Gate:
    // O firmă poate accesa CV-ul și datele de contact ale unui student EXCLUSIV
    // dacă studentul a adăugat o ofertă a acelei firme în preferințele sale.
    const appliedStudentIds = new Set(
      offers.flatMap((o) => o.preferences.map((p) => p.studentId))
    );

    const sanitizedStudents = allRawStudents.map((s) =>
      sanitizeStudentProfileForCompany(s, appliedStudentIds.has(s.id))
    );

    companyData = {
      offers,
      availableTags,
      allStudents: sanitizedStudents,
    };
  }

  // 3. Date necesare pentru Dashboard Coordonator (Partea 2A - Gale-Shapley)
  let coordinatorData = null;
  if (currentUser && currentUser.role === UserRole.COORDINATOR) {
    coordinatorData = await getCoordinatorDashboardData();
  }

  return (
    <main className="min-h-screen bg-[#040812] text-slate-100 relative overflow-hidden flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Glowuri radiale cybernetice în colțuri și centru */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-sky-500/10 pointer-events-none -z-10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-indigo-600/10 pointer-events-none -z-10 rounded-full blur-[140px]" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-600/10 pointer-events-none -z-10 rounded-full blur-[130px]" />

      {/* Top Navigation Bar Unificat (Fără fundal alb) */}
      <AppHeader currentUser={currentUser} />

      <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-10 flex-1 w-full">
        {currentUser ? (
          currentUser.role === UserRole.STUDENT && currentUser.studentProfile && studentData ? (
            /* VEDERE COMPLETĂ DASHBOARD STUDENT (PARTEA 1A) */
            <StudentDashboard
              user={currentUser}
              profile={currentUser.studentProfile}
              availableTags={studentData.availableTags}
              offers={studentData.offers}
              preferences={studentData.preferences}
            />
          ) : currentUser.role === UserRole.COMPANY_TUTOR && currentUser.companyProfile && companyData ? (
            /* VEDERE COMPLETĂ DASHBOARD COMPANIE / TUTORE (PARTEA 1B) */
            <CompanyDashboard
              user={currentUser}
              profile={currentUser.companyProfile}
              offers={companyData.offers}
              availableTags={companyData.availableTags}
              allStudents={companyData.allStudents}
            />
          ) : currentUser.role === UserRole.COORDINATOR && coordinatorData ? (
            /* VEDERE COMPLETĂ DASHBOARD COORDONATOR (PARTEA 2A - GALE-SHAPLEY) */
            <CoordinatorDashboard
              user={currentUser}
              data={coordinatorData}
            />
          ) : (
            /* VEDERE SKELETON PENTRU CELELALTE ROLURI (ex: Admin) */
            <RoleDashboardSkeleton
              role={currentUser.role}
              userName={`${currentUser.firstName} ${currentUser.lastName}`}
            />
          )
        ) : (
          /* VEDERE LANDING PAGE & AUTENTIFICARE FUTURISTICĂ (CENTRĂ, FĂRĂ SPLIT-SCREEN & FĂRĂ FUNDAL ALB) */
          <div className="space-y-12 max-w-5xl mx-auto">
            {/* Hero Section */}
            <header className="text-center space-y-4 pt-4 sm:pt-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-950/40 text-sky-300 rounded-full text-xs font-semibold border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.12)]">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Matching Profesional & Stagii de Practică • Facultatea de Inginerie ULBS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                Conectăm viitorii ingineri cu{" "}
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                  companiile partenere
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                Algoritm stabil <strong className="text-sky-300">Gale-Shapley</strong>, catalog cu 41 de competențe inginerești, 
                protecție strictă a CV-ului prin GDPR Privacy Gate și programare directă a interviurilor.
              </p>
            </header>

            {/* Auth Section Centrat */}
            <section className="py-2 flex justify-center">
              <AuthCard />
            </section>

            {/* Overview Grid Module P14 în Stil Futuristic */}
            <section className="space-y-6 pt-8 border-t border-sky-500/20">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-400 uppercase tracking-widest">
                  <Layers className="w-3.5 h-3.5 text-sky-400" />
                  Arhitectură de Sistem
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Modulele Platformei P14</h2>
                <p className="text-xs text-slate-400">Flux integrat pentru studenți, companii partenere, coordonatori și administratori</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Modul Studenți */}
                <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] rounded-xl p-5 space-y-3 relative group hover:border-sky-400/40 transition">
                  <div className="w-10 h-10 bg-sky-950/60 border border-sky-500/30 text-sky-400 rounded-xl flex items-center justify-center font-bold shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Modul Studenți (Activ)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Feed personalizat de oferte ordonat descrescător după scorul de compatibilitate, catalog 41 tag-uri, 
                    upload CV protejat și listă ordonată de preferințe.
                  </p>
                  <div className="pt-2 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/30 rounded text-[11px]">
                      Partea 1A Activă
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded text-[11px] text-slate-300">
                      CV securizat
                    </span>
                  </div>
                </div>

                {/* Modul Companii */}
                <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] rounded-xl p-5 space-y-3 relative group hover:border-sky-400/40 transition">
                  <div className="w-10 h-10 bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 rounded-xl flex items-center justify-center font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Modul Companii (Activ)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Publicare oferte cu competențe obligatorii/opționale, vizualizare aplicanți, descărcare CV conform GDPR, 
                    ierarhizare Gale-Shapley și programare interviuri.
                  </p>
                  <div className="pt-2 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30 rounded text-[11px]">
                      Partea 1B Activă
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded text-[11px] text-slate-300">
                      Privacy Gate
                    </span>
                  </div>
                </div>

                {/* Modul Coordonator */}
                <div className="bg-[#0B1221]/80 backdrop-blur-xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] rounded-xl p-5 space-y-3 relative group hover:border-sky-400/40 transition">
                  <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-500/30 text-indigo-400 rounded-xl flex items-center justify-center font-bold shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-sm">Modul Coordonator (Activ)</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Rulare centralizată Gale-Shapley Many-to-One, realocare minimală la excepții umane, 
                    generare convenții oficiale de practică în format PDF și pontaj.
                  </p>
                  <div className="pt-2 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-indigo-500/15 text-indigo-300 font-semibold border border-indigo-500/30 rounded text-[11px]">
                      Partea 2A Activă
                    </span>
                    <span className="px-2 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded text-[11px] text-slate-300">
                      Gale-Shapley Engine
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Footer High-Tech */}
        <footer className="text-center text-xs text-slate-500 pt-8 border-t border-sky-500/15 pb-4">
          Laborator Web 2 • Universitatea „Lucian Blaga” din Sibiu • Proiect P14 Portal de Practică • Cyber-Engineering Enterprise Dark
        </footer>
      </div>
    </main>
  );
}
