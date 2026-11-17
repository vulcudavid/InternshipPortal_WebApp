import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AuthCard } from "@/components/auth-card";
import { RoleDashboardSkeleton } from "@/components/role-dashboard-skeleton";
import { StudentDashboard } from "@/components/student/student-dashboard";
import { CompanyDashboard } from "@/components/company/company-dashboard";
import { logoutAction } from "@/app/actions/auth";
import { sanitizeStudentProfileForCompany } from "@/lib/privacy";
import { 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  LogOut, 
  Sparkles 
} from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function Home() {
  const currentUser = await getCurrentUser();

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

  return (
    <main className="min-h-screen bg-slate-50/80 text-slate-800 relative overflow-hidden">
      {/* Glow de fundal odihnitor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent pointer-events-none -z-10 rounded-full blur-3xl" />

      {/* Top Navigation Bar */}
      <nav className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-lg shadow-sm">
              P14
            </div>
            <div>
              <span className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight block tracking-tight">
                Portal Practică Inginerie
              </span>
              <span className="text-[11px] text-slate-500 block leading-tight font-medium">
                Universitatea „Lucian Blaga” din Sibiu
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentUser ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-900">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                    {currentUser.role === "STUDENT"
                      ? "Student"
                      : currentUser.role === "COMPANY_TUTOR"
                      ? "Firmă / Tutore"
                      : "Coordonator"}
                  </span>
                </div>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-red-600 transition flex items-center gap-1.5 text-xs font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Deconectare</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Module Active (Student & Firmă)
                </span>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-10">
        {currentUser ? (
          currentUser.role === UserRole.STUDENT && currentUser.studentProfile && studentData ? (
            /* VEDERE COMPLETĂ DASHBOARD STUDENT (PARTEA 1A - OFERTE IMPLICIT) */
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
          ) : (
            /* VEDERE SKELETON PENTRU CELELALTE ROLURI (Coordonator, Admin) */
            <RoleDashboardSkeleton
              role={currentUser.role}
              userName={`${currentUser.firstName} ${currentUser.lastName}`}
            />
          )
        ) : (
          /* VEDERE LANDING PAGE & AUTENTIFICARE */
          <>
            {/* Hero Section */}
            <header className="text-center space-y-4 max-w-3xl mx-auto pt-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-100/70 text-blue-800 rounded-full text-xs font-bold border border-blue-200/50">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                <span>Matching Profesional & Stagii de Practică • Facultatea de Inginerie ULBS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                Conectăm viitorii ingineri cu <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">companiile partenere</span>
              </h1>
              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
                Algoritm stabil <strong>Gale-Shapley</strong>, catalog cu 41 de competențe inginerești, 
                protecție strictă a CV-ului prin GDPR Privacy Gate și programare directă a interviurilor.
              </p>
            </header>

            {/* Auth Section */}
            <section className="py-2">
              <AuthCard />
            </section>

            {/* Overview Grid */}
            <section className="space-y-6 pt-6 border-t border-slate-200/70">
              <div className="text-center space-y-1">
                <h2 className="text-lg font-bold text-slate-900">Modulele Platformei P14</h2>
                <p className="text-xs text-slate-500">Flux complet de lucru pentru studenți, tutori de companie și coordonatori</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-2.5">
                  <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Modul Studenți (Activ)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Feed personalizat de oferte ordonat descrescător după scorul de compatibilitate, catalog 41 tag-uri, 
                    upload CV protejat și listă ordonată de preferințe.
                  </p>
                  <div className="pt-1 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded text-[11px]">
                      Partea 1A Activă
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600">CV securizat</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-2.5">
                  <div className="w-9 h-9 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Modul Companii (Activ)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Publicare oferte cu competențe obligatorii/opționale, vizualizare aplicanți, descărcare CV conform GDPR, 
                    ierarhizare Gale-Shapley și programare interviuri.
                  </p>
                  <div className="pt-1 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 rounded text-[11px]">
                      Partea 1B Activă
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600">Privacy Gate</span>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 space-y-2.5">
                  <div className="w-9 h-9 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Modul Coordonator (În curând)</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Rulare centralizată Gale-Shapley Many-to-One, realocare minimală la excepții umane, 
                    generare convenții oficiale de practică în format PDF și pontaj.
                  </p>
                  <div className="pt-1 flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-semibold border border-purple-200 rounded text-[11px]">
                      Partea 2
                    </span>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600">PDF Prefilled</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 pt-6 border-t border-slate-200/70">
          Laborator Web 2 • Universitatea „Lucian Blaga” din Sibiu • Proiect P14 Portal de Practică
        </footer>
      </div>
    </main>
  );
}
