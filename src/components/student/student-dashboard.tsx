"use client";

import { useState } from "react";
import { EngineeringDomain, ProficiencyLevel } from "@prisma/client";
import { DOMAIN_LABELS } from "@/lib/tags";
import { ProfileEditor } from "./profile-editor";
import { TagSelector } from "./tag-selector";
import { CvManager } from "./cv-manager";
import { OffersExplorer, OfferData } from "./offers-explorer";
import { PreferencesManager, PreferenceItem } from "./preferences-manager";
import { 
  GraduationCap, 
  Sparkles, 
  UserCheck, 
  Code2, 
  Compass, 
  ListOrdered, 
  FileText, 
  BookOpen, 
  Calendar, 
  Users, 
  CheckCircle2, 
  ShieldCheck 
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
}

export function StudentDashboard({
  user,
  profile,
  availableTags,
  offers,
  preferences,
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "offers" | "preferences">("profile");

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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* 1. Antet Social & Academic al Studentului */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center font-bold text-3xl shadow-inner shrink-0">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                {/* Badge Oficial Specializare ULBS */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/30 backdrop-blur border border-blue-400/40 text-blue-100">
                  <BookOpen className="w-3.5 h-3.5" />
                  {profile.specialization}
                </span>

                {/* Badge An de Studiu */}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/30 backdrop-blur border border-indigo-400/40 text-indigo-100">
                  <Calendar className="w-3.5 h-3.5" />
                  Anul {profile.studyYear}
                </span>

                {/* Badge Grupa */}
                {profile.group && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur border border-white/20 text-white">
                    <Users className="w-3 h-3" />
                    {profile.group}
                  </span>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user.firstName} {user.lastName}
              </h2>

              <p className="text-xs sm:text-sm text-blue-100 max-w-xl">
                {profile.headline || "Completează headline-ul profesional în secțiunea de editare profil."}
              </p>
            </div>
          </div>

          {/* Quick Stats Banner */}
          <div className="flex flex-wrap md:flex-col gap-2.5 shrink-0 w-full md:w-auto">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-between gap-3 text-xs">
              <span className="text-blue-200">Domeniu Inginerie:</span>
              <span className="font-bold text-white text-right">
                {DOMAIN_LABELS[profile.domain]}
              </span>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-between gap-3 text-xs">
              <span className="text-blue-200">Preferințe Gale-Shapley:</span>
              <span className="font-bold text-emerald-300">
                {preferences.length} alese
              </span>
            </div>

            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/15 flex items-center justify-between gap-3 text-xs">
              <span className="text-blue-200">Status CV:</span>
              <span className={`font-bold ${profile.cvUrl ? "text-emerald-300" : "text-amber-300"}`}>
                {profile.cvUrl ? "Încărcat & Protejat" : "Neîncărcat"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Meniu de Navigare Taburi */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("profile")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === "profile"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Profil, Competențe & CV</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
            {profile.tags.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("offers")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === "offers"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Explorare Oferte</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
            {offers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("preferences")}
          className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition flex items-center gap-2 ${
            activeTab === "preferences"
              ? "bg-purple-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Preferințele Mele Gale-Shapley</span>
          <span className="px-1.5 py-0.2 bg-white/20 rounded-md text-[10px]">
            {preferences.length}
          </span>
        </button>
      </div>

      {/* 3. Conținut Tab Activ */}
      {activeTab === "profile" && (
        <div className="space-y-8">
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

      {activeTab === "offers" && (
        <OffersExplorer
          offers={offers}
          studentDomain={profile.domain}
          studentSkills={currentSkills}
          preferredOfferIds={preferredOfferIds}
          preferencesRankMap={preferencesRankMap}
        />
      )}

      {activeTab === "preferences" && (
        <PreferencesManager preferences={preferences} />
      )}
    </div>
  );
}
