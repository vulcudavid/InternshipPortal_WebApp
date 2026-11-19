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
}

export function StudentDashboard({
  user,
  profile,
  availableTags,
  offers,
  preferences,
  placement,
}: StudentDashboardProps) {
  // 1. Implicit se deschide tabul de STAGIU & CONVENȚIE dacă este confirmat, altfel OFERTE
  const [activeTab, setActiveTab] = useState<"offers" | "preferences" | "profile" | "convention">(
    placement && placement.status === "CONFIRMED" ? "convention" : "offers"
  );
  
  // Stare pentru editare profil (implicit este în mod VIZUALIZARE curat)
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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "INTERMEDIATE":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
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
      {/* Antet Odihnitor și Elegant */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Glow de fundal subtil */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 -top-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-inner shrink-0">
              {user.firstName.charAt(0)}{user.lastName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur border border-white/15 text-blue-200">
                  <BookOpen className="w-3 h-3" />
                  {profile.specialization}
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/10 backdrop-blur border border-white/15 text-indigo-200">
                  <Calendar className="w-3 h-3" />
                  Anul {profile.studyYear}
                </span>

                {profile.group && (
                  <span className="text-[11px] text-slate-300 font-medium px-2 py-0.5 bg-white/5 rounded-full">
                    Grupa {profile.group}
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {user.firstName} {user.lastName}
              </h1>

              {profile.headline ? (
                <p className="text-xs text-blue-200/90 italic max-w-xl line-clamp-1">
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
            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">
                Competențe
              </span>
              <span className="text-sm font-extrabold text-white">
                {profile.tags.length}
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">
                Preferințe
              </span>
              <span className="text-sm font-extrabold text-emerald-300">
                {preferences.length} alese
              </span>
            </div>

            <div className="px-3.5 py-2 rounded-2xl bg-white/10 backdrop-blur border border-white/10 text-center">
              <span className="text-[10px] uppercase tracking-wider text-slate-300 block font-semibold">
                CV
              </span>
              <span className={`text-xs font-bold block ${profile.cvUrl ? "text-emerald-300" : "text-amber-300"}`}>
                {profile.cvUrl ? "Activ" : "Lipsă"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bară Navigare Taburi - Eye Friendly */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        {/* TAB 1: OFERTE (IMPLICIT) */}
        <button
          type="button"
          onClick={() => {
            setActiveTab("offers");
            setIsEditingProfile(false);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "offers"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Oferte de Practică Recomandate</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
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
              ? "bg-white text-purple-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Preferințele Mele Gale-Shapley</span>
          {preferences.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
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
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <User className="w-4 h-4" />
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
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Stagiu & Convenție</span>
            {placement.status === "CONFIRMED" && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
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

      {/* TAB 3: PROFILUL MEU (VIZUALIZARE CURATĂ + BUTON EDITARE) */}
      {activeTab === "profile" && (
        <div className="space-y-6">
          {/* Header Profil cu buton de comutare Editare */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                {isEditingProfile ? "Editare Profil & Competențe" : "Profilul Tău Profesional & Academic"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditingProfile
                  ? "Modifică informațiile academice, bio, link-urile sociale, catalogul de competențe și CV-ul tău."
                  : "Așa este vizualizat profilul tău în platformă. Firmele la care aplici vor vedea aceste date."}
              </p>
            </div>

            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm ${
                isEditingProfile
                  ? "bg-slate-800 hover:bg-slate-900 text-white"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
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

          {/* VIZUALIZARE PROFIL (CURATĂ, FĂRĂ FORMULARE ÎNCĂRCATE) */}
          {!isEditingProfile && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Coloana 1: Date Personale & Social */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Informații Contact & Social
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  {profile.phone ? (
                    <div className="flex items-center gap-2 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{profile.phone}</span>
                    </div>
                  ) : (
                    <div className="text-slate-400 italic">Fără telefon adăugat</div>
                  )}

                  {profile.githubUrl && (
                    <div className="flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-slate-600 shrink-0" />
                      <a
                        href={profile.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {profile.githubUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}

                  {profile.linkedinUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-600 shrink-0" />
                      <a
                        href={profile.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {profile.linkedinUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}

                  {profile.portfolioUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                      <a
                        href={profile.portfolioUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline truncate"
                      >
                        {profile.portfolioUrl.replace("https://", "")}
                      </a>
                    </div>
                  )}
                </div>

                {/* CV Status Card */}
                <div className="pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
                    Fișier CV (PDF)
                  </span>

                  {profile.cvUrl ? (
                    <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-emerald-600" />
                          CV Încărcat
                        </span>
                        <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-semibold">
                          Protejat GDPR
                        </span>
                      </div>
                      <a
                        href={`/api/cv/${profile.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
                      >
                        <span>Deschide CV-ul tău</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <p className="text-xs text-slate-500 mb-2">Nu ai încărcat niciun CV.</p>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
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
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Despre Mine & Obiective
                  </h3>
                  {profile.bio ? (
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                      {profile.bio}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">
                      Nu ai adăugat încă o descriere bio. Apasă pe &ldquo;Editează Profilul&rdquo; pentru a scrie despre interesele tale inginerești.
                    </p>
                  )}
                </div>

                {/* Competențe Tehnice (Tag-uri cu nivel) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Competențe Inginerești ({profile.tags.length})
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Aceste tag-uri determină scorul de compatibilitate la ofertele de practică.
                      </p>
                    </div>

                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Modifică</span>
                    </button>
                  </div>

                  {profile.tags.length === 0 ? (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs text-slate-500 mb-2">Nu ai adăugat încă nicio competență.</p>
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold shadow-xs"
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

          {/* FORMULARE DE EDITARE (DESCHISE DOAR DACĂ UTILIZATORUL APASĂ EDITARE) */}
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
    </div>
  );
}
