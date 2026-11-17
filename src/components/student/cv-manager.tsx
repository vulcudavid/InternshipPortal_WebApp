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

  // Upload fișier PDF
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

  // Salvare link extern
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Curriculum Vitae (CV) & Protecție Privacy
          </h3>
          <p className="text-xs text-slate-500">
            Încarcă CV-ul în format PDF sau atașează un link extern securizat.
          </p>
        </div>

        {cvUrl ? (
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              CV Activ
            </span>
            <a
              href={`/api/cv/${studentProfileId}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Deschide CV
            </a>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            Niciun CV încărcat
          </span>
        )}
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Banner Confidențialitate (Privacy Gate) */}
      <div className="p-4 bg-purple-50/60 border border-purple-200/80 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Protecție de Confidențialitate Activă (Privacy Gate P14)</span>
        </div>
        <p className="text-[11px] text-purple-800 leading-relaxed">
          CV-ul tău detaliat și datele de contact directe sunt <strong>strict confidențiale</strong>. 
          Reprezentanții companiilor partenere le pot vizualiza <strong>exclusiv dacă adaugi o ofertă a acelei companii în lista ta de preferințe</strong> (sau ai fost inclus în clasamentul acesteia). În rest, companiile văd doar profilul profesional anonimizat.
        </p>
      </div>

      {/* Switch Mod: Upload Fișier vs Link Extern */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveMode("file")}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === "file"
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
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
                ? "bg-purple-600 text-white"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            Link Extern (Drive / Cloud)
          </button>
        </div>

        {activeMode === "file" ? (
          /* Zona Upload Fișier */
          <div className="space-y-3">
            <label className="border-2 border-dashed border-purple-200 hover:border-purple-400 bg-purple-50/30 hover:bg-purple-50/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition text-center group">
              <Upload className="w-8 h-8 text-purple-500 mb-2 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-800">
                Click pentru a selecta documentul tău CV (format PDF)
              </span>
              <span className="text-[11px] text-slate-500 mt-1">
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
              <div className="flex items-center justify-center gap-2 text-xs text-purple-700 py-2">
                <span className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></span>
                <span>Se încarcă și se securizează documentul...</span>
              </div>
            )}
          </div>
        ) : (
          /* Formular Link Extern */
          <form onSubmit={handleLinkSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Link către CV (Google Drive, Dropbox, OneDrive etc.)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  required
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition shrink-0"
                >
                  {isPending ? "Se salvează..." : "Salvează Link"}
                </button>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Asigură-te că link-ul extern are permisiuni de vizualizare („Anyone with the link can view”).
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
