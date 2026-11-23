"use client";

import { useState, useTransition } from "react";
import { updateCompanyProfile } from "@/app/actions/company";
import { Building2, Globe, MapPin, Phone, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface CompanyProfileEditorProps {
  profile: {
    id: string;
    companyName: string;
    cuiCif: string;
    address: string;
    city: string;
    website?: string | null;
    description?: string | null;
    contactPhone?: string | null;
  };
}

export function CompanyProfileEditor({ profile }: CompanyProfileEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    companyName: profile.companyName,
    cuiCif: profile.cuiCif,
    city: profile.city,
    address: profile.address,
    website: profile.website || "",
    description: profile.description || "",
    contactPhone: profile.contactPhone || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await updateCompanyProfile(formData);
        setSuccessMsg("Profilul companiei a fost actualizat cu succes!");
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "A apărut o eroare la salvare.");
      }
    });
  };

  return (
    <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] overflow-hidden">
      <div className="p-6 border-b border-sky-500/15 bg-[#070D19]/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950/60 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Profil Companie & Date Juridice</h2>
            <p className="text-xs text-slate-400">
              Aceste informații sunt vizibile studenților în ofertele de practică și vor apărea pe Convenția Oficială de Practică.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {successMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nume Companie */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Nume Companie <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                placeholder="Ex: Continental Automotive Sibiu"
              />
            </div>
          </div>

          {/* CUI / CIF */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Cod CUI / CIF <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.cuiCif}
                onChange={(e) => setFormData({ ...formData, cuiCif: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 font-mono placeholder-slate-500"
                placeholder="Ex: RO12345678"
              />
            </div>
          </div>

          {/* Oraș */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Oraș Sediul Central <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                placeholder="Ex: Sibiu"
              />
            </div>
          </div>

          {/* Telefon Contact */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Telefon Contact / Tutore
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                placeholder="Ex: +40 269 123 456"
              />
            </div>
          </div>

          {/* Adresă Completă */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Adresă Sediu Fizic <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
              placeholder="Ex: Str. Salzburg nr. 8, Parc Industrial Vest"
            />
          </div>

          {/* Website */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Website Companie / Pagină Carieră
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                placeholder="https://www.example.com"
              />
            </div>
          </div>

          {/* Descriere Companie */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Descriere Companie & Domeniu de Activitate
            </label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
              placeholder="Prezentați pe scurt compania, departamentele tehnice și oportunitățile de carieră oferite studenților..."
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-sky-500/15">
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(14,165,233,0.35)] transition disabled:opacity-50"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin text-slate-950" />}
            <span>Salvează Datele Companiei</span>
          </button>
        </div>
      </form>
    </div>
  );
}
