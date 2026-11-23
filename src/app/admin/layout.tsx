import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { AppHeader } from "@/components/app-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN || !user.isActive) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-transparent text-slate-100 relative overflow-hidden flex flex-col selection:bg-sky-500/30 selection:text-sky-200">
      {/* Glowuri radiale cybernetice în colțuri și centru */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[350px] bg-sky-500/10 pointer-events-none -z-10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-10 w-[450px] h-[350px] bg-amber-600/10 pointer-events-none -z-10 rounded-full blur-[140px]" />
      <div className="absolute bottom-10 left-10 w-[400px] h-[300px] bg-cyan-600/10 pointer-events-none -z-10 rounded-full blur-[130px]" />

      <div className="relative z-10 flex flex-col min-h-screen bg-transparent">
        <AppHeader currentUser={user} />

        <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8 space-y-6 flex-1 w-full bg-transparent">
          {children}
        </div>
      </div>
    </main>
  );
}
