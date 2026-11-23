import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal Practică Inginerie | Universitatea „Lucian Blaga” din Sibiu",
  description:
    "Platformă oficială de practică universitară — Facultatea de Inginerie ULBS: matching Gale-Shapley, convenții PDF și pontaj ore.",
  icons: {
    icon: "/images/ulbs-shield.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="dark">
      <body className="min-h-screen bg-[#040812] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200 relative">
        {/* Contur Cyberpunk / Blueprint fix permanent al Facultății de Inginerie din Sibiu */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/inginerie-sibiu-cyber.png')",
            opacity: 0.25,
          }}
        />

        {/* Foreground Content */}
        <div className="relative z-10 flex min-h-screen flex-col bg-transparent">
          {children}
        </div>
      </body>
    </html>
  );
}
