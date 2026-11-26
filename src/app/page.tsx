import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { AuthCard } from "@/components/auth-card";
import { AppHeader } from "@/components/app-header";

const StudentDashboard = dynamic(
  () => import("@/components/student/student-dashboard").then((mod) => mod.StudentDashboard)
);
const CompanyDashboard = dynamic(
  () => import("@/components/company/company-dashboard").then((mod) => mod.CompanyDashboard)
);
const CoordinatorDashboard = dynamic(
  () => import("@/components/coordinator/coordinator-dashboard").then((mod) => mod.CoordinatorDashboard)
);
const RoleDashboardSkeleton = dynamic(
  () => import("@/components/role-dashboard-skeleton").then((mod) => mod.RoleDashboardSkeleton)
);
import { getCoordinatorDashboardData } from "@/app/actions/coordinator";
import { getSystemSettings } from "@/lib/settings";
import { sanitizeStudentProfileForCompany } from "@/lib/privacy";
import { Sparkles } from "lucide-react";
import { UserRole } from "@prisma/client";

export default async function Home() {
  const currentUser = await getCurrentUser();

  if (currentUser && currentUser.role === UserRole.ADMIN) {
    redirect("/admin");
  }

  // 1. Date necesare pentru Dashboard Student (Partea 1A)
  let studentData = null;
  if (currentUser && currentUser.role === UserRole.STUDENT && currentUser.studentProfile) {
    const [availableTags, offers, preferences, placement, settings] = await Promise.all([
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
      prisma.placement.findUnique({
        where: { studentId: currentUser.studentProfile.id },
        include: {
          offer: {
            include: {
              company: true,
            },
          },
          convention: true,
          workLogs: {
            orderBy: { date: "desc" },
          },
          evaluation: true,
        },
      }),
      getSystemSettings(),
    ]);

    studentData = {
      availableTags,
      offers,
      preferences,
      placement,
      requiredHours: settings.requiredHours,
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
          placements: {
            where: {
              status: "CONFIRMED",
            },
            include: {
              offer: {
                select: { id: true, title: true },
              },
              student: {
                include: {
                  user: { select: { firstName: true, lastName: true, email: true } },
                },
              },
              workLogs: {
                orderBy: { date: "desc" },
              },
              evaluation: true,
            },
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

    const companyPlacements = offers.flatMap((o) => (o as any).placements || []);

    companyData = {
      offers,
      availableTags,
      allStudents: sanitizedStudents,
      placements: companyPlacements,
    };
  }

  // 3. Date necesare pentru Dashboard Coordonator (Partea 2A - Gale-Shapley)
  let coordinatorData = null;
  if (currentUser && currentUser.role === UserRole.COORDINATOR) {
    coordinatorData = await getCoordinatorDashboardData();
  }

  return (
    <main className="min-h-screen bg-transparent text-slate-100 relative overflow-hidden flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Glowuri radiale cybernetice în colțuri și centru */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-sky-500/10 pointer-events-none -z-10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-indigo-600/10 pointer-events-none -z-10 rounded-full blur-[140px]" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-600/10 pointer-events-none -z-10 rounded-full blur-[130px]" />

      <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
        {/* Top Navigation Bar Unificat (Fără fundal alb) */}
        <AppHeader currentUser={currentUser} />

        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 w-full bg-transparent flex flex-col ${
          currentUser ? "py-8 sm:py-10 space-y-10" : "py-6 sm:py-8 justify-center"
        }`}>
        {currentUser ? (
          currentUser.role === UserRole.STUDENT && currentUser.studentProfile && studentData ? (
            /* VEDERE COMPLETĂ DASHBOARD STUDENT (PARTEA 1A) */
            <StudentDashboard
              user={currentUser}
              profile={currentUser.studentProfile}
              availableTags={studentData.availableTags}
              offers={studentData.offers}
              preferences={studentData.preferences}
              placement={studentData.placement}
              requiredHours={studentData.requiredHours}
            />
          ) : currentUser.role === UserRole.COMPANY_TUTOR && currentUser.companyProfile && companyData ? (
            /* VEDERE COMPLETĂ DASHBOARD COMPANIE / TUTORE (PARTEA 1B) */
            <CompanyDashboard
              user={currentUser}
              profile={currentUser.companyProfile}
              offers={companyData.offers}
              availableTags={companyData.availableTags}
              allStudents={companyData.allStudents}
              placements={companyData.placements}
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
          <div className="w-full max-w-4xl mx-auto flex flex-col justify-center items-center space-y-6 sm:space-y-8 my-auto">
            {/* Hero Section */}
            <header className="text-center space-y-3 sm:space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-950/40 text-sky-300 rounded-full text-xs font-semibold border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.12)]">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Matching Profesional & Stagii de Practică • Facultatea de Inginerie ULBS</span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl mx-auto">
                Conectăm viitorii ingineri cu{" "}
                <span className="bg-gradient-to-r from-sky-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(14,165,233,0.3)]">
                  companiile partenere
                </span>
              </h1>
            </header>

            {/* Auth Section Centrat */}
            <section className="w-full flex justify-center">
              <AuthCard />
            </section>
          </div>
        )}

        {/* Footer High-Tech */}
        <footer className="text-center text-xs text-slate-500 pt-6 border-t border-sky-500/15 pb-4 mt-auto">
          Laborator Web 2 • Universitatea „Lucian Blaga” din Sibiu • Facultatea de Inginerie • Portal Practică • Cyber-Engineering Enterprise Dark
        </footer>
      </div>
    </div>
  </main>
);
}
