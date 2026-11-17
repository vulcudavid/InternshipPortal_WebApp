"use client";

import { useState } from "react";
import { CompanyProfileEditor } from "./company-profile-editor";
import { OfferManager } from "./offer-manager";
import { ApplicantsManager, StudentData } from "./applicants-manager";
import { InterviewManager } from "./interview-manager";
import { 
  Building2, 
  Briefcase, 
  Users, 
  Calendar, 
  Award, 
  MapPin, 
  Globe, 
  Phone,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { EngineeringDomain, OfferStatus, ProficiencyLevel } from "@prisma/client";

interface TagItem {
  id: string;
  name: string;
  domain: EngineeringDomain;
  isPredefined: boolean;
}

interface CompanyDashboardProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
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
  offers: any[];
  availableTags: TagItem[];
  allStudents: StudentData[];
}

export function CompanyDashboard({
  user,
  profile,
  offers,
  availableTags,
  allStudents,
}: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<"OFFERS" | "APPLICANTS" | "INTERVIEWS" | "PROFILE">("OFFERS");

  // Calcul statistici rapide
  const totalOffers = offers.length;
  const activeOffers = offers.filter((o) => o.status === OfferStatus.ACTIVE).length;
  const totalApplicants = offers.reduce((acc, o) => acc + (o.preferences?.length || 0), 0);
  const totalRanked = offers.reduce((acc, o) => acc + (o.applicantRanks?.length || 0), 0);
  const totalSlots = offers.reduce((acc, o) => acc + (o.interviewSlots?.length || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Companie */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-black text-2xl shadow-md shrink-0">
              {profile.companyName.charAt(0)}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">{profile.companyName}</h1>
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">
                  Companie Parteneră ULBS
                </span>
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                <span className="font-mono">CUI: {profile.cuiCif}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {profile.city}, {profile.address}
                </span>
                {profile.contactPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {profile.contactPhone}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Privacy Gate Activ
            </span>
          </div>
        </div>

        {/* Statistici rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Oferte Active
            </span>
            <span className="text-xl font-bold text-slate-900 mt-0.5 block">
              {activeOffers} <span className="text-xs font-normal text-slate-400">/ {totalOffers}</span>
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Aplicanți Înscriși
            </span>
            <span className="text-xl font-bold text-blue-600 mt-0.5 block">
              {totalApplicants}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Candidați Ierarhizați
            </span>
            <span className="text-xl font-bold text-indigo-600 mt-0.5 block">
              {totalRanked}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Sloturi Interviu
            </span>
            <span className="text-xl font-bold text-emerald-600 mt-0.5 block">
              {totalSlots}
            </span>
          </div>
        </div>
      </div>

      {/* Bară de Navigare Tab-uri */}
      <div className="flex bg-slate-200/70 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("OFFERS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "OFFERS"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Oferte de Practică ({totalOffers})</span>
        </button>

        <button
          onClick={() => setActiveTab("APPLICANTS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "APPLICANTS"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Candidați & Clasament Gale-Shapley</span>
          {totalApplicants > 0 && (
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 text-[10px] flex items-center justify-center font-bold">
              {totalApplicants}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("INTERVIEWS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "INTERVIEWS"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Programare Interviuri ({totalSlots})</span>
        </button>

        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "bg-white text-blue-700 shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Profil Companie & Juridic</span>
        </button>
      </div>

      {/* Conținut Tab Curent */}
      <div>
        {activeTab === "OFFERS" && (
          <OfferManager
            offers={offers}
            availableTags={availableTags}
            defaultTutorName={`${user.firstName} ${user.lastName}`}
            defaultTutorEmail={user.email}
            defaultLocation={`${profile.city}, ${profile.address}`}
          />
        )}

        {activeTab === "APPLICANTS" && (
          <ApplicantsManager
            offers={offers}
            allStudents={allStudents}
            companyId={profile.id}
          />
        )}

        {activeTab === "INTERVIEWS" && (
          <InterviewManager offers={offers} />
        )}

        {activeTab === "PROFILE" && (
          <CompanyProfileEditor profile={profile} />
        )}
      </div>
    </div>
  );
}
