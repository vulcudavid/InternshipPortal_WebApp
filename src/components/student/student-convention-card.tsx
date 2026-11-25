"use client";

import React, { useState, useTransition } from "react";
import {
  generateConventionForPlacement,
  markConventionSignedByStudent,
  uploadSignedConventionScan,
} from "@/app/actions/convention";
import { refusePlacement } from "@/app/actions/student";
import { ConventionStatus, PlacementStatus } from "@prisma/client";
import {
  FileText,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building,
  Calendar,
  AlertCircle,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";

interface StudentConventionCardProps {
  placement: {
    id: string;
    status: string;
    cancelReason?: string | null;
    offer: {
      title: string;
      location: string;
      startDate: Date;
      endDate: Date;
      tutorName: string;
      tutorEmail: string;
      company: {
        companyName: string;
        city: string;
        address: string;
      };
    };
    convention?: {
      id: string;
      conventionNumber: string;
      status: ConventionStatus;
      generatedPdfUrl?: string | null;
      signedPdfUrl?: string | null;
      signedAt?: Date | null;
      approvedAt?: Date | null;
    } | null;
  };
}

export function StudentConventionCard({ placement }: StudentConventionCardProps) {
  const [isPending, startTransition] = useTransition();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const conv = placement.convention;
  const isConfirmed = placement.status === PlacementStatus.CONFIRMED;
  const isPendingConf = placement.status === PlacementStatus.PENDING_CONFIRMATION;
  const isRefused = placement.status === PlacementStatus.REFUSED_BY_STUDENT;
  const isCancelled =
    placement.status === PlacementStatus.CANCELLED_BY_COMPANY ||
    placement.status === PlacementStatus.CANCELLED_BY_COORDINATOR;

  const handleGenerate = () => {
    if (!isConfirmed) {
      alert("Convenția oficială poate fi generată doar după confirmarea finală a plasamentului de către coordonator.");
      return;
    }

    setStatusMsg(null);
    startTransition(async () => {
      try {
        await generateConventionForPlacement(placement.id);
        setStatusMsg({ type: "success", text: "Convenția a fost generată cu succes!" });
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Eroare la generarea convenției." });
      }
    });
  };

  const handleRefuse = () => {
    const ok = window.confirm(
      "Sunteți sigur că doriți să refuzați locul repartizat la această companie?\n\nLocul va fi eliberat în sistem, iar coordonatorul academic va fi notificat pentru procedura de Realocare Minimală."
    );
    if (!ok) return;

    setStatusMsg(null);
    startTransition(async () => {
      try {
        const res = await refusePlacement(placement.id);
        setStatusMsg({ type: "success", text: res.message });
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Eroare la refuzul plasamentului." });
      }
    });
  };

  const handleMarkSigned = () => {
    if (!conv) return;
    setStatusMsg(null);
    startTransition(async () => {
      try {
        await markConventionSignedByStudent(conv.id);
        setStatusMsg({ type: "success", text: "Convenția a fost marcată ca semnată de către student!" });
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Eroare la marcarea convenției." });
      }
    });
  };

  const handleUploadScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conv || !selectedFile) return;
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("signedScan", selectedFile);

    startTransition(async () => {
      try {
        await uploadSignedConventionScan(conv.id, formData);
        setSelectedFile(null);
        setStatusMsg({ type: "success", text: "Scanul convenției semnate a fost încărcat cu succes!" });
      } catch (err: any) {
        setStatusMsg({ type: "error", text: err.message || "Eroare la încărcarea scanului." });
      }
    });
  };

  const getPlacementBadge = () => {
    if (isConfirmed) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-300 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Stagiu de Practică Confirmat Oficial
        </span>
      );
    }
    if (isPendingConf) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <Clock className="w-3 h-3 text-amber-400" /> Plasament Provizoriu (În Așteptare Confirmare)
        </span>
      );
    }
    if (isRefused) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-300 bg-rose-500/15 px-2.5 py-0.5 rounded-full border border-rose-500/30 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
          <X className="w-3 h-3 text-rose-400" /> Loc Refuzat de Student
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">
        <AlertTriangle className="w-3 h-3" /> Plasament Anulat
      </span>
    );
  };

  const getConventionBadge = () => {
    if (!conv) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
          <Clock className="w-3.5 h-3.5 text-amber-400" /> Convenție Negenerată
        </span>
      );
    }

    switch (conv.status) {
      case ConventionStatus.APPROVED_BY_COORDINATOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aprobată de Coordonator
          </span>
        );
      case ConventionStatus.SIGNED_BY_STUDENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.15)]">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" /> Semnată de Student (În Așteptare Aprobare)
          </span>
        );
      case ConventionStatus.GENERATED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]">
            <FileText className="w-3.5 h-3.5 text-sky-400" /> Generată (Necesită Semnătură)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            {conv.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
      {/* Header Plasament & Convenție */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-sky-500/15">
        <div>
          <div className="flex items-center gap-2">
            {getPlacementBadge()}
            {conv && (
              <span className="text-xs font-mono text-slate-400">
                Nr. {conv.conventionNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            {placement.offer.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1">
            <span className="inline-flex items-center gap-1 font-medium text-slate-200">
              <Building className="w-3.5 h-3.5 text-sky-400" />
              {placement.offer.company.companyName} ({placement.offer.company.city})
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-400" />
              05.07.2027 – 25.07.2027 (90 ore)
            </span>
            <span>Tutore: {placement.offer.tutorName}</span>
          </div>
        </div>

        <div className="shrink-0">
          {isConfirmed ? getConventionBadge() : null}
        </div>
      </div>

      {/* Mesaj de stare (succes / eroare) */}
      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-950/40 text-emerald-200 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-rose-950/40 text-rose-200 border border-rose-500/40 shadow-[0_0_15px_rgba(244,63,94,0.15)]"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* BANNER SPECIAL: PENDING_CONFIRMATION (Cerința 3 & 9) */}
      {isPendingConf && (
        <div className="bg-amber-950/30 border border-amber-500/30 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <h4 className="text-sm font-bold text-amber-300">
                Plasament Provizoriu Gale-Shapley
              </h4>
            </div>
            <p className="text-xs text-amber-200/80 leading-relaxed max-w-xl">
              Ați fost repartizat la această companie pe baza algoritmului Gale-Shapley. Plasamentul este în curs de aprobare de către coordonatorul academic. Convenția oficială va putea fi descărcată imediat după confirmare.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRefuse}
            disabled={isPending}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-rose-100 border border-rose-500/40 rounded-xl text-xs font-bold transition cursor-pointer shadow-[0_0_12px_rgba(244,63,94,0.15)] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <X className="w-3.5 h-3.5 text-rose-400" />
            )}
            <span>Refuză locul repartizat</span>
          </button>
        </div>
      )}

      {/* BANNER SPECIAL: REFUSED_BY_STUDENT */}
      {isRefused && (
        <div className="bg-rose-950/30 border border-rose-500/30 rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2">
            <X className="w-4 h-4 text-rose-400 shrink-0" />
            <h4 className="text-sm font-bold text-rose-300">
              Ați refuzat locul la această ofertă
            </h4>
          </div>
          <p className="text-xs text-rose-200/80 leading-relaxed">
            Locul a fost eliberat în sistem. Coordonatorul academic a fost notificat și veți fi inclus în procedura de Realocare Minimală pentru posturile rămase vacante.
          </p>
        </div>
      )}

      {/* BANNER SPECIAL: CANCELLED */}
      {isCancelled && (
        <div className="bg-slate-900/60 border border-slate-700 rounded-xl p-5 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
            <h4 className="text-sm font-bold text-slate-300">
              Plasament anulat
            </h4>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Motiv: {placement.cancelReason || "Nu a fost specificat un motiv."}
          </p>
        </div>
      )}

      {/* Corpul acțiunilor convenției (activ doar când CONFIRMED) */}
      {isConfirmed && (
        <>
          {!conv ? (
            <div className="bg-[#070D19]/70 rounded-xl p-5 border border-sky-500/20 text-center space-y-3">
              <FileText className="w-10 h-10 text-sky-400 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Convenția de practică nu a fost generată încă
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5">
                  Formularul oficial ULBS (cu datele Facultății de Inginerie, ale partenerului de practică și portofoliul de competențe) poate fi generat automat acum.
                </p>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_20px_rgba(14,165,233,0.35)] transition cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Generează Convenția PDF Oficială</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pasul 1: Descărcare și Previzualizare */}
              <div className="bg-[#070D19]/70 rounded-xl p-5 border border-sky-500/20 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Download className="w-4 h-4 text-sky-400" />
                    <span>1. Descarcă Convenția Completată</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Documentul oficial A4 generat pe baza șablonului Facultății de Inginerie ULBS, cu toate datele precompletate și diacritice românești (ă, â, î, ș, ț).
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <a
                    href={`/api/conventions/${conv.id}/download`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descarcă PDF Oficial</span>
                  </a>

                  <a
                    href={`/api/conventions/${conv.id}/preview`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0B1221] hover:bg-sky-500/10 text-slate-200 text-xs font-medium rounded-xl border border-sky-500/30 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>Previzualizare</span>
                  </a>
                </div>
              </div>

              {/* Pasul 2: Semnare / Încărcare Scan Semnat */}
              <div className="bg-[#070D19]/70 rounded-xl p-5 border border-sky-500/20 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Upload className="w-4 h-4 text-indigo-400" />
                    <span>2. Semnare Digitală sau Încărcare Scan</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Puteți marca documentul ca semnat direct din portal sau puteți încărca scanul semnat olograf (.pdf, .png, .jpg).
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {conv.status === ConventionStatus.GENERATED && (
                    <button
                      onClick={handleMarkSigned}
                      disabled={isPending}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(99,102,241,0.3)] transition cursor-pointer"
                    >
                      {isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5" />
                      )}
                      <span>Marchează ca Semnată de Mine</span>
                    </button>
                  )}

                  <form onSubmit={handleUploadScan} className="space-y-2">
                    <input
                      type="file"
                      accept=".pdf,image/png,image/jpeg"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="block w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-sky-950/60 file:text-sky-300 file:border file:border-sky-500/30 hover:file:bg-sky-900/60 cursor-pointer"
                    />
                    {selectedFile && (
                      <button
                        type="submit"
                        disabled={isPending}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(14,165,233,0.3)] transition cursor-pointer"
                      >
                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>Încarcă Scan Semnat ({selectedFile.name})</span>
                      </button>
                    )}
                  </form>

                  {conv.signedPdfUrl && (
                    <div className="pt-1">
                      <a
                        href={`/api/conventions/${conv.id}/download?signed=true`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold hover:underline"
                      >
                        <Download className="w-3 h-3" />
                        <span>Descarcă Scanul Semnat Încărcat</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Dacă plasamentul este provizoriu, convenția este dezactivată cu mesaj explicativ */}
      {isPendingConf && (
        <div className="p-4 bg-[#070D19]/60 border border-dashed border-sky-500/20 rounded-xl text-center space-y-2">
          <FileText className="w-8 h-8 text-slate-500 mx-auto" />
          <h4 className="text-xs font-bold text-slate-300">
            Generarea Convenției este temporar blocată
          </h4>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Convenția de practică devine activă doar după ce coordonatorul academic validează plasamentul provizoriu (status CONFIRMED).
          </p>
          <button
            disabled
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 text-slate-500 text-xs font-semibold rounded-lg cursor-not-allowed opacity-60"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Generează Convenție (Blocat până la confirmare)</span>
          </button>
        </div>
      )}
    </div>
  );
}
