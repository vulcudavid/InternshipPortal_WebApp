"use client";

import { useState, useTransition } from "react";
import { 
  ULBS_ENGINEERING_SPECIALIZATIONS, 
  STUDY_YEARS 
} from "@/lib/specializations";
import { updateStudentProfile } from "@/app/actions/student";
import { requestDataErasure } from "@/app/actions/gdpr";
import { 
  User, 
  BookOpen, 
  Calendar, 
  Phone, 
  Globe, 
  Sparkles, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Trash2,
  AlertTriangle
} from "lucide-react";

function GithubIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

function LinkedinIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
    </svg>
  );
}

interface ProfileEditorProps {
  initialData: {
    specialization: string;
    studyYear: number;
    group: string;
    headline: string | null;
    bio: string | null;
    phone: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    availableFrom: Date | null;
    availableTo: Date | null;
    gdprConsent?: boolean;
    gdprConsentAt?: Date | null;
  };
}

export function ProfileEditor({ initialData }: ProfileEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [specialization, setSpecialization] = useState(
    initialData.specialization || ULBS_ENGINEERING_SPECIALIZATIONS[0].name
  );
  const [studyYear, setStudyYear] = useState<number>(initialData.studyYear || 3);
  const [group, setGroup] = useState(initialData.group || "");
  const [headline, setHeadline] = useState(initialData.headline || "");
  const [bio, setBio] = useState(initialData.bio || "");
  const [phone, setPhone] = useState(initialData.phone || "");
  const [githubUrl, setGithubUrl] = useState(initialData.githubUrl || "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialData.linkedinUrl || "");
  const [portfolioUrl, setPortfolioUrl] = useState(initialData.portfolioUrl || "");
  const [availableFrom, setAvailableFrom] = useState(
    initialData.availableFrom ? new Date(initialData.availableFrom).toISOString().slice(0, 10) : ""
  );
  const [availableTo, setAvailableTo] = useState(
    initialData.availableTo ? new Date(initialData.availableTo).toISOString().slice(0, 10) : ""
  );
  const [gdprConsent, setGdprConsent] = useState<boolean>(
    Boolean(initialData.gdprConsent)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await updateStudentProfile({
          specialization,
          studyYear,
          group,
          headline,
          bio,
          phone,
          githubUrl,
          linkedinUrl,
          portfolioUrl,
          availableFrom: availableFrom || null,
          availableTo: availableTo || null,
          gdprConsent,
        });

        if (result?.success) {
          setSuccessMessage(result.message || "Profilul a fost salvat!");
          setTimeout(() => setSuccessMessage(null), 4000);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "A apărut o eroare la salvarea profilului.");
      }
    });
  };

  const handleErasureRequest = () => {
    const confirmed = window.confirm(
      "ATENȚIE! Această acțiune este ireversibilă conform Art. 17 GDPR.\n\nDatele dvs. de identificare (nume, prenume, telefon, CV și profil social) vor fi anonimizate sau șterse complet din sistem.\n\nSunteți sigur că doriți să continuați?"
    );

    if (!confirmed) return;

    startTransition(async () => {
      try {
        const res = await requestDataErasure();
        alert(res.message);
        window.location.reload();
      } catch (err: any) {
        alert(err.message || "Eroare la solicitarea anonimizării datelor.");
      }
    });
  };

  return (
    <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
      <div className="flex items-center justify-between border-b border-sky-500/15 pb-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-sky-400" />
            Date Academice & Profil Profesional
          </h3>
          <p className="text-xs text-slate-400">
            Facultatea de Inginerie • Universitatea „Lucian Blaga” din Sibiu
          </p>
        </div>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Date Academice Oficiale ULBS */}
        <div className="p-4 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-4">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            Apartenență Academică Oficială ULBS
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Specializare */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Program de Studii (Specializare) *
              </label>
              <select
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white focus:outline-none focus:border-sky-400 font-medium"
              >
                {ULBS_ENGINEERING_SPECIALIZATIONS.map((spec) => (
                  <option key={spec.name} value={spec.name}>
                    {spec.name} {spec.abbreviation ? `(${spec.abbreviation})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* An de studiu */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                An de studiu *
              </label>
              <select
                value={studyYear}
                onChange={(e) => setStudyYear(Number(e.target.value))}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white focus:outline-none focus:border-sky-400 font-medium"
              >
                {STUDY_YEARS.map((y) => (
                  <option key={y.value} value={y.value}>
                    {y.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Grupa */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Grupă / Semigrupă *
              </label>
              <input
                type="text"
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="Ex: 331 CTI, 321 TI"
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Headline & Bio */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Titlu profesional / Headline
            </label>
            <div className="relative">
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="Ex: Student CTI pasionat de Cloud, DevOps și Sisteme Distribuite"
                className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 pl-8"
              />
              <Sparkles className="w-4 h-4 text-sky-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Despre mine (Bio / Motivație pentru stagiu)
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Prezintă pe scurt experiența ta, tehnologiile preferate și ce tip de proiecte cauți pentru practica universitară..."
              className="w-full text-xs p-3 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Link-uri Social & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
              Număr Telefon (Privat până la aplicare)
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+40 7xx xxx xxx"
              className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <GithubIcon className="w-3.5 h-3.5 text-slate-300" />
              Profil GitHub
            </label>
            <input
              type="url"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/username"
              className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <LinkedinIcon className="w-3.5 h-3.5 text-sky-400" />
              Profil LinkedIn
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/username"
              className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              Portofoliu Web / Website Personal
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={(e) => setPortfolioUrl(e.target.value)}
              placeholder="https://myportfolio.dev"
              className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>
        </div>

        {/* Disponibilitate */}
        <div className="p-3 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-2">
          <label className="block text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-sky-400" />
            Interval de Disponibilitate pentru Practică
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Disponibil de la:</span>
              <input
                type="date"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white focus:outline-none focus:border-sky-400"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 block mb-0.5">Disponibil până la:</span>
              <input
                type="date"
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="w-full text-xs px-3 py-1.5 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white focus:outline-none focus:border-sky-400"
              />
            </div>
          </div>
        </div>

        {/* Consimțământ GDPR */}
        <div className="p-4 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-2">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="gdprConsent"
              checked={gdprConsent}
              onChange={(e) => setGdprConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-sky-500/40 bg-[#0B1221] text-sky-500 focus:ring-sky-400 cursor-pointer"
            />
            <label htmlFor="gdprConsent" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
              <span className="font-bold flex items-center gap-1 text-sky-300 mb-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Consimțământ GDPR (Prelucrare date personale):
              </span>
              Sunt de acord cu prelucrarea datelor mele cu caracter personal (nume, adresă de email, telefon, CV și profil academic) de către Facultatea de Inginerie ULBS și companiile partenere de practică, strict în vederea organizării, repartizării și desfășurării stagiilor de practică universitară.
            </label>
          </div>
          {initialData.gdprConsentAt && (
            <p className="text-[11px] text-slate-400 pl-7">
              Consimțământ înregistrat la data de: {new Date(initialData.gdprConsentAt).toLocaleString("ro-RO")}
            </p>
          )}
        </div>

        {/* Buton Salvare */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-[0_0_20px_rgba(14,165,233,0.35)] cursor-pointer"
          >
            {isPending ? (
              <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-4 h-4" />
            )}
            Salvează Datele Profilului
          </button>
        </div>
      </form>

      {/* Secțiune Dreptul la Ștergere / Art. 17 GDPR */}
      <div className="pt-4 border-t border-sky-500/15">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/25 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Dreptul la Ștergerea Datelor (Art. 17 GDPR)
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Puteți solicita oricând anonimizarea ireversibilă a identității dvs. și ștergerea fișierului CV de pe serverele universității. Istoricul statistic al plasamentului va fi conservat anonimizat.
            </p>
          </div>
          <button
            type="button"
            onClick={handleErasureRequest}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(244,63,94,0.3)] transition shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Anonimizare Date (GDPR)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
