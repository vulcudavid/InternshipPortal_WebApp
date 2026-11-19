"use client";

import React, { useState, useTransition } from "react";
import {
  generateConventionForPlacement,
  markConventionSignedByStudent,
  uploadSignedConventionScan,
} from "@/app/actions/convention";
import { ConventionStatus } from "@prisma/client";
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
} from "lucide-react";

interface StudentConventionCardProps {
  placement: {
    id: string;
    status: string;
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

  const handleGenerate = () => {
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

  const getStatusBadge = () => {
    if (!conv) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3.5 h-3.5" /> Convenție Negenerată
        </span>
      );
    }

    switch (conv.status) {
      case ConventionStatus.APPROVED_BY_COORDINATOR:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Aprobată de Coordonator
          </span>
        );
      case ConventionStatus.SIGNED_BY_STUDENT:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Semnată de Student (În Așteptare Aprobare)
          </span>
        );
      case ConventionStatus.GENERATED:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <FileText className="w-3.5 h-3.5" /> Generată (Necesită Semnătură)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {conv.status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
      {/* Header Plasament & Convenție */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3" /> Stagiu de Practică Confirmat
            </span>
            {conv && (
              <span className="text-xs font-medium text-slate-500">
                Nr. {conv.conventionNumber}
              </span>
            )}
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            {placement.offer.title}
          </h2>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              {placement.offer.company.companyName} ({placement.offer.company.city})
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              05.07.2027 – 25.07.2027 (90 ore)
            </span>
            <span>Tutore: {placement.offer.tutorName}</span>
          </div>
        </div>

        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-rose-50 text-rose-800 border border-rose-200"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Corpul acțiunilor convenției */}
      {!conv ? (
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-400 mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Convenția de practică nu a fost generată încă
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-0.5">
              Formularul oficial ULBS (cu datele Facultății de Inginerie, ale partenerului de practică și portofoliul de competențe) poate fi generat automat acum.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
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
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Download className="w-4 h-4 text-blue-600" />
                <span>1. Descarcă Convenția Completată</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Documentul oficial A4 generat pe baza șablonului Facultății de Inginerie ULBS, cu toate datele precompletate și diacritice românești (ă, â, î, ș, ț).
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`/api/conventions/${conv.id}/download`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descarcă PDF Oficial</span>
              </a>

              <a
                href={`/api/conventions/${conv.id}/preview`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Previzualizare</span>
              </a>
            </div>
          </div>

          {/* Pasul 2: Semnare / Încărcare Scan Semnat */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/60 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>2. Semnare Digitală sau Încărcare Scan</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Puteți marca documentul ca semnat direct din portal sau puteți încărca scanul semnat olograf (.pdf, .png, .jpg).
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {conv.status === ConventionStatus.GENERATED && (
                <button
                  onClick={handleMarkSigned}
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
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
                  className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 file:border file:border-slate-200 hover:file:bg-slate-50 cursor-pointer"
                />
                {selectedFile && (
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-600 text-white text-xs font-semibold rounded-lg shadow-sm transition cursor-pointer"
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
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold hover:underline"
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
    </div>
  );
}
