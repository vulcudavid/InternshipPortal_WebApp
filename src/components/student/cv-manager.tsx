"use client";

import { useState, useTransition } from "react";
import { uploadCvFile, saveCvLink } from "@/app/actions/student";
import { 
  FileText, 
  Upload, 
  Link as LinkIcon, 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  FileCheck
} from "lucide-react";

interface CvManagerProps {
  studentProfileId: string;
  initialCvUrl: string | null;
}

export function CvManager({ studentProfileId, initialCvUrl }: CvManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [cvUrl, setCvUrl] = useState<string | null>(initialCvUrl);
  const [linkInput, setLinkInput] = useState<string>(
    initialCvUrl && (initialCvUrl.startsWith("http://") || initialCvUrl.startsWith("https://"))
      ? initialCvUrl
      : ""
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeMode, setActiveMode] = useState<"file" | "link">("file");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Doar fișierele în format PDF sunt acceptate.");
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("cvFile", file);

    startTransition(async () => {
      try {
        const result = await uploadCvFile(formData);
        if (result?.success) {
          setCvUrl(result.cvUrl);
          setSuccessMessage(`Fișierul PDF "${result.fileName || file.name}" a fost încărcat cu succes!`);
          setTimeout(() => setSuccessMessage(null), 4000);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "A apărut o eroare la încărcarea CV-ului.");
      }
    });
  };

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInput.trim()) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    startTransition(async () => {
      try {
        const result = await saveCvLink(linkInput.trim());
        if (result?.success) {
          setCvUrl(result.cvUrl);
          setSuccessMessage("Link-ul către CV-ul extern a fost salvat!");
          setTimeout(() => setSuccessMessage(null), 4000);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "A apărut o eroare la salvarea link-ului.");
      }
    });
  };

  return (
    <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            Curriculum Vitae (CV) & Protecție Privacy
          </h3>
          <p className="text-xs text-slate-400">
            Încarcă CV-ul în format PDF sau atașează un link extern securizat.
          </p>
        </div>

        {cvUrl ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              CV Activ
            </span>
            <a
              href={`/api/cv/${studentProfileId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl border border-sky-500/30 hover:bg-sky-500/10 text-sky-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Deschide CV
            </a>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-950/40 text-amber-300 border border-amber-500/30">
            Niciun CV încărcat
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Banner Confidențialitate (Privacy Gate) */}
      <div className="p-4 bg-[#070D19]/70 border border-indigo-500/30 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>Protecție de Confidențialitate Activă (Privacy Gate P14)</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          CV-ul tău detaliat și datele de contact directe sunt <strong>strict confidențiale</strong>. 
          Reprezentanții companiilor partenere le pot vizualiza <strong>exclusiv dacă adaugi o ofertă a acelei companii în lista ta de preferințe</strong> (sau ai fost inclus în clasamentul acesteia). În rest, companiile văd doar profilul profesional anonimizat.
        </p>
      </div>

      {/* Switch Mod: Upload Fișier vs Link Extern */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-sky-500/15 pb-2">
          <button
            type="button"
            onClick={() => setActiveMode("file")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === "file"
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-sky-500/5"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Încarcă Fișier PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("link")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === "link"
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_10px_rgba(14,165,233,0.2)]"
                : "text-slate-400 hover:text-white hover:bg-sky-500/5"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link Extern (Drive / Cloud)
          </button>
        </div>

        {activeMode === "file" ? (
          /* Zona Upload Fișier */
          <div className="space-y-3">
            <label className="border-2 border-dashed border-sky-500/30 hover:border-sky-400 bg-[#070D19]/60 hover:bg-[#070D19]/90 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <Upload className="w-8 h-8 text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-200">
                Click pentru a selecta documentul tău CV (format PDF)
              </span>
              <span className="text-[11px] text-slate-400 mt-1">
                Dimensiune maximă: 10 MB • Fișiere acceptate: .pdf
              </span>
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileUpload}
                disabled={isPending}
                className="hidden"
              />
            </label>

            {isPending && (
              <div className="flex items-center justify-center gap-2 text-xs text-sky-300 py-2">
                <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin"></span>
                <span>Se încarcă și se securizează documentul...</span>
              </div>
            )}
          </div>
        ) : (
          /* Formular Link Extern */
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Link către CV (Google Drive, Dropbox, OneDrive etc.)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                >
                  {isPending ? "Se salvează..." : "Salvează Link"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Asigură-te că link-ul extern are permisiuni de vizualizare („Anyone with the link can view”).
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
