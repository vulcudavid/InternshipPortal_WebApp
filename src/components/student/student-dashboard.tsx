"use client";

import { useState } from "react";
import { EngineeringDomain, ProficiencyLevel } from "@prisma/client";
import { DOMAIN_LABELS } from "@/lib/tags";
import { ProfileEditor } from "./profile-editor";
import { TagSelector } from "./tag-selector";
import { CvManager } from "./cv-manager";
import { OffersExplorer, OfferData } from "./offers-explorer";
import { PreferencesManager, PreferenceItem } from "./preferences-manager";
import { StudentConventionCard } from "./student-convention-card";
import { WorkLogManager } from "./work-log-manager";
import { 
  GraduationCap, 
  Sparkles, 
  Compass, 
  ListOrdered, 
  User, 
  FileText, 
  BookOpen, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ShieldCheck,
  CalendarCheck2,
  Edit3,
  ExternalLink,
  Globe,
  Code2,
  Phone,
  Mail,
  Tag as TagIcon,
  Check,
  ArrowRight
} from "lucide-react";

interface StudentDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  profile: {
    id: string;
    specialization: string;
    studyYear: number;
    group: string;
    domain: EngineeringDomain;
    faculty: string;
    headline: string | null;
    bio: string | null;
    phone: string | null;
    cvUrl: string | null;
    githubUrl: string | null;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    availableFrom: Date | null;
    availableTo: Date | null;
    gdprConsent?: boolean;
    gdprConsentAt?: Date | null;
    tags: {
      tagId: string;
      proficiency: ProficiencyLevel;
      tag: {
        id: string;
        name: string;
        domain: EngineeringDomain;
        isPredefined: boolean;
      };
    }[];
  };
  availableTags: {
    id: string;
    name: string;
    domain: EngineeringDomain;
    isPredefined: boolean;
  }[];
  offers: OfferData[];
  preferences: PreferenceItem[];
  placement?: any;
  requiredHours?: number;
}

export function StudentDashboard({
  user,
  profile,
  availableTags,
  offers,
  preferences,
  placement,
  requiredHours = 90,
}: StudentDashboardProps) {
  // Implicit se deschide tabul de STAGIU & CONVENȚIE dacă este confirmat, altfel OFERTE
  const [activeTab, setActiveTab] = useState<"offers" | "preferences" | "profile" | "convention" | "worklog">(
    placement && placement.status === "CONFIRMED" ? "convention" : "offers"
  );
  
  // Stare pentru editare profil
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Formatare competențe pentru sub-componente
  const currentSkills = profile.tags.map((t) => ({
    tagId: t.tag.id,
    tagName: t.tag.name,
    domain: t.tag.domain,
    proficiency: t.proficiency,
  }));

  const preferredOfferIds = preferences.map((p) => p.offerId);
  const preferencesRankMap = preferences.reduce<Record<string, number>>((acc, curr) => {
    acc[curr.offerId] = curr.rank;
    return acc;
  }, {});

  const getProficiencyBadge = (level: ProficiencyLevel) => {
    switch (level) {
      case "ADVANCED":
        return "bg-emerald-950/40 text-emerald-300 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]";
      case "INTERMEDIATE":
        return "bg-sky-950/40 text-sky-300 border-sky-500/30 shadow-[0_0_10px_rgba(14,165,233,0.15)]";
      default:
        return "bg-slate-800/60 text-slate-300 border-slate-700/60";
    }
  };

  const getProficiencyLabel = (level: ProficiencyLevel) => {
    switch (level) {
      case "ADVANCED":
        return "Avansat";
      case "INTERMEDIATE":
        return "Intermediar";
      default:
        return "Începător";
    }
  };

  return (
    <div className="space-y-6">
      {/* Antet Futuristic Student */}
      <div className="bg-gradient-to-r from-sky-950/60 via-[#0B1221] to-indigo-950/60 rounded-3xl p-6 sm:p-7 text-white shadow-[0_0_35px_rgba(14,165,233,0.1)] border border-sky-400/20 backdrop-blur-xl relative overflow-hidden">
        {/* Glow de fundal subtil */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition"></div>
              <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[#070D19] border border-sky-300/40 text-sky-300 flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(14,165,233,0.3)] shrink-0">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-300 border border-sky-500/30">
                  <BookOpen className="w-3 h-3 text-sky-400" />
                  {profile.specialization}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  <Calendar className="w-3 h-3 text-indigo-400" />
                  Anul {profile.studyYear}
                </span>

                {profile.group && (
                  <span className="text-[11px] text-slate-300 font-medium px-2 py-0.5 bg-slate-800/60 border border-slate-700/50 rounded-full">
                    Grupa {profile.group}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {user.firstName} {user.lastName}
              </h1>

              {profile.headline ? (
                <p className="text-xs text-sky-200/80 italic max-w-xl line-clamp-1">
                  &ldquo;{profile.headline}&rdquo;
                </p>
              ) : (
                <p className="text-xs text-slate-400">
                  Completează-ți profilul pentru un scor de compatibilitate optimizat.
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="px-3.5 py-2 rounded-2xl bg-[#070D19]/80 backdrop-blur border border-sky-500/20 text-center shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Competențe
              </span>
              <span className="text-sm font-extrabold text-white">
                {profile.tags.length}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#070D19]/80 backdrop-blur border border-sky-500/20 text-center shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                Preferințe
              </span>
              <span className="text-sm font-extrabold text-cyan-300">
                {preferences.length} alese
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-[#070D19]/80 backdrop-blur border border-sky-500/20 text-center shadow-inner">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-semibold">
                CV
              </span>
              <span className={`text-xs font-bold block ${profile.cvUrl ? "text-emerald-400" : "text-amber-400"}`}>
                {profile.cvUrl ? "Activ" : "Lipsă"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bară Navigare Taburi Futuristic Dark */}
      <div className="flex bg-[#070D19]/80 backdrop-blur-xl border border-sky-500/20 p-1.5 rounded-2xl gap-1 overflow-x-auto shadow-sm">
        {/* TAB 1: OFERTE (IMPLICIT) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("offers");
            setIsEditingProfile(false);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "offers"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Oferte de Practică Recomandate</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-950 text-sky-300 border border-sky-500/30">
            {offers.length}
          </span>
        </button>

        {/* TAB 2: PREFERINȚE */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("preferences");
            setIsEditingProfile(false);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "preferences"
              ? "bg-purple-500/20 text-purple-300 border border-purple-400/40 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              : "text-slate-400 hover:text-purple-200 hover:bg-purple-500/5"
          }`}
        >
          <ListOrdered className="w-4 h-4 text-purple-400" />
          <span>Preferințele Mele Gale-Shapley</span>
          {preferences.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-500/30">
              {preferences.length}
            </span>
          )}
        </button>

        {/* TAB 3: PROFILUL MEU */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("profile");
            setIsEditingProfile(false);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "profile"
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
              : "text-slate-400 hover:text-indigo-200 hover:bg-indigo-500/5"
          }`}
        >
          <User className="w-4 h-4 text-indigo-400" />
          <span>Profilul Meu & CV</span>
        </button>

        {/* TAB 4: STAGIU & CONVENȚIE (Dacă există plasament) */}
        {placement && (
          <button
            type="button"
            onClick={() => {
              setActiveTab("convention");
              setIsEditingProfile(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "convention"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "text-slate-400 hover:text-emerald-200 hover:bg-emerald-500/5"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Stagiu & Convenție</span>
            {placement.status === "CONFIRMED" && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}
          </button>
        )}

        {/* TAB 5: JURNAL ORE & EVALUARE (Dacă există plasament) */}
        {placement && (
          <button
            type="button"
            onClick={() => {
              setActiveTab("worklog");
              setIsEditingProfile(false);
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === "worklog"
                ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
                : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
            }`}
          >
            <CalendarCheck2 className="w-4 h-4 text-sky-400" />
            <span>Jurnal Ore & Evaluare</span>
            {placement.workLogs && placement.workLogs.some((w: any) => w.status === "PENDING") && (
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
            )}
          </button>
        )}
      </div>

      {/* CONȚINUT TAB ACTIV */}

      {/* TAB 1: EXPLORARE OFERTE (IMPLICIT) */}
      {activeTab === "offers" && (
        <OffersExplorer
          offers={offers}
          studentDomain={profile.domain}
          studentSkills={currentSkills}
          preferredOfferIds={preferredOfferIds}
          preferencesRankMap={preferencesRankMap}
          currentStudentId={profile.id}
        />
      )}

      {/* TAB 2: PREFERINȚE GALE-SHAPLEY */}
      {activeTab === "preferences" && (
        <PreferencesManager preferences={preferences} />
      )}

      {/* TAB 3: PROFILUL MEU */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Header Profil cu buton de comutare Editare */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1221]/88 backdrop-blur-xl p-6 rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-sky-400" />
                {isEditingProfile ? "Editare Profil & Competențe" : "Profilul Tău Profesional & Academic"}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {isEditingProfile
                  ? "Modifică informațiile academice, bio, link-urile sociale, catalogul de competențe și CV-ul tău."
                  : "Așa este vizualizat profilul tău în platformă. Firmele la care aplici vor vedea aceste date."}
              </p>
            </div>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                isEditingProfile
                  ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                  : "bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-[0_0_20px_rgba(14,165,233,0.35)]"
              }`}
            >
              {isEditingProfile ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Vezi Profilul Salvat</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-4 h-4" />
                  <span>Editează Profilul & Competențele</span>
                </>
              )}
            </button>
          </div>

          {/* VIZUALIZARE PROFIL */}
          {!isEditingProfile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coloana 1: Date Personale & Social */}
              <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 p-6 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-5">
                <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                  Informații Contact & Social
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-4 h-4 text-sky-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {profile.phone ? (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Phone className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  ) : (
                    <div className="text-slate-500 italic">Fără telefon adăugat</div>
                  )}

                  {profile.githubUrl && (
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-sky-400 shrink-0" />
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 hover:underline truncate"
                      >
                        {profile.githubUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}

                  {profile.linkedinUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 hover:underline truncate"
                      >
                        {profile.linkedinUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}

                  {profile.portfolioUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-sky-400 shrink-0" />
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sky-300 hover:underline truncate"
                      >
                        {profile.portfolioUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}
                </div>

                {/* CV Status Card */}
                <div className="pt-4 border-t border-sky-500/15">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Fișier CV (PDF)
                  </span>

                  {profile.cvUrl ? (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-400" />
                          CV Încărcat
                        </span>
                        <span className="text-[10px] text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                          Protejat GDPR
                        </span>
                      </div>
                      <a
                        href={`/api/cv/${profile.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
                      >
                        <span>Deschide CV-ul tău</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#070D19]/60 border border-sky-500/20 rounded-xl text-center">
                      <p className="text-xs text-slate-400 mb-2">Nu ai încărcat niciun CV.</p>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="text-xs font-bold text-sky-400 hover:underline"
                      >
                        Încarcă CV acum
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Coloana 2 & 3: Bio & Competențe Declarate */}
              <div className="md:col-span-2 space-y-6">
                {/* Despre Mine / Bio */}
                <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 p-6 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-3">
                  <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                    Despre Mine & Obiective
                  </h3>
                  {profile.bio ? (
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Nu ai adăugat încă o descriere bio. Apasă pe &ldquo;Editează Profilul&rdquo; pentru a scrie despre interesele tale inginerești.
                    </p>
                  )}
                </div>

                {/* Competențe Tehnice */}
                <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 p-6 shadow-[0_0_25px_rgba(14,165,233,0.06)] space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-sky-400 uppercase tracking-wider">
                        Competențe Inginerești ({profile.tags.length})
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Aceste tag-uri determină scorul de compatibilitate la ofertele de practică.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs font-bold text-sky-400 hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifică</span>
                    </button>
                  </div>

                  {profile.tags.length === 0 ? (
                    <div className="p-6 bg-[#070D19]/60 rounded-xl border border-dashed border-sky-500/20 text-center">
                      <p className="text-xs text-slate-400 mb-2">Nu ai adăugat încă nicio competență.</p>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3 py-1.5 bg-sky-500 text-slate-950 rounded-lg text-xs font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]"
                      >
                        Alege competențe din catalog
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.tags.map((st) => (
                        <div
                          key={st.tagId}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold ${getProficiencyBadge(
                            st.proficiency
                          )}`}
                        >
                          <TagIcon className="w-3 h-3 opacity-60" />
                          <span>{st.tag.name}</span>
                          <span className="text-[10px] font-bold opacity-75 border-l border-current/20 pl-1.5">
                            {getProficiencyLabel(st.proficiency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FORMULARE DE EDITARE */}
          {isEditingProfile && (
            <div className="space-y-8 animate-in fade-in duration-150">
              <ProfileEditor
                initialData={{
                  specialization: profile.specialization,
                  studyYear: profile.studyYear,
                  group: profile.group,
                  headline: profile.headline,
                  bio: profile.bio,
                  phone: profile.phone,
                  githubUrl: profile.githubUrl,
                  linkedinUrl: profile.linkedinUrl,
                  portfolioUrl: profile.portfolioUrl,
                  availableFrom: profile.availableFrom,
                  availableTo: profile.availableTo,
                  gdprConsent: profile.gdprConsent,
                  gdprConsentAt: profile.gdprConsentAt,
                }}
              />

              <TagSelector
                availableTags={availableTags}
                currentSkills={currentSkills}
              />

              <CvManager
                studentProfileId={profile.id}
                initialCvUrl={profile.cvUrl}
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 4: STAGIU & CONVENȚIE DE PRACTICĂ */}
      {activeTab === "convention" && placement && (
        <StudentConventionCard placement={placement} />
      )}

      {/* TAB 5: JURNAL ORE & EVALUARE FINALĂ */}
      {activeTab === "worklog" && placement && (
        <WorkLogManager
          placementId={placement.id}
          workLogs={placement.workLogs || []}
          requiredHours={requiredHours || 90}
          evaluation={placement.evaluation || null}
          offerTitle={placement.offer?.title || "Stagiu de practică"}
          companyName={placement.offer?.company?.companyName || "Companie parteneră"}
        />
      )}
    </div>
  );
}
