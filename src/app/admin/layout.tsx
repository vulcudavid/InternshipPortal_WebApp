import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

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
    <main className="min-h-screen bg-slate-50/80 text-slate-800 relative overflow-hidden">
      {/* Glow de fundal odihnitor conform design system-ului */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-80 bg-gradient-to-b from-blue-100/40 via-indigo-50/20 to-transparent pointer-events-none -z-10 rounded-full blur-3xl" />
      <div className="max-w-7xl mx-auto py-8 sm:py-10 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}
