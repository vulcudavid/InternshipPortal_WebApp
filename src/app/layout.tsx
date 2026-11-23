import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "P14 Portal de Practică | Matching Studenți - Firme",
  description: "Platformă de practică universitară: matching Gale-Shapley, convenții PDF și pontaj ore.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className="dark">
      <body className="min-h-screen bg-[#040812] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
