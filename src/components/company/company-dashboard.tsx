"use client";

import { useState } from "react";
import { CompanyProfileEditor } from "./company-profile-editor";
import { OfferManager } from "./offer-manager";
import { ApplicantsManager, StudentData } from "./applicants-manager";
import { InterviewManager } from "./interview-manager";
import { WorkLogValidator } from "./work-log-validator";
import { FinalEvaluationForm } from "./final-evaluation-form";
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
  Sparkles,
  CalendarCheck2
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
  placements?: any[];
}

export function CompanyDashboard({
  user,
  profile,
  offers,
  availableTags,
  allStudents,
  placements = [],
}: CompanyDashboardProps) {
  const [activeTab, setActiveTab] = useState<"OFFERS" | "APPLICANTS" | "INTERVIEWS" | "WORKLOGS" | "EVALUATION" | "PROFILE">("OFFERS");

  const totalOffers = offers.length;
  const activeOffers = offers.filter((o) => o.status === OfferStatus.ACTIVE).length;
  const totalApplicants = offers.reduce((acc, o) => acc + (o.preferences?.length || 0), 0);
  const totalRanked = offers.reduce((acc, o) => acc + (o.applicantRanks?.length || 0), 0);
  const totalSlots = offers.reduce((acc, o) => acc + (o.interviewSlots?.length || 0), 0);
  const totalInterns = placements.length;
  const pendingLogsCount = placements.reduce(
    (acc, p) => acc + (p.workLogs?.filter((w: any) => w.status === "PENDING").length || 0),
    0
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Header Companie Futuristic Dark */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-3xl border border-sky-400/20 shadow-[0_0_35px_rgba(14,165,233,0.08)] p-6 md:p-8 space-y-6 relative overflow-hidden">
        {/* Glow de fundal */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-blue-600 rounded-2xl blur-xs opacity-70 group-hover:opacity-100 transition"></div>
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-400 via-sky-500 to-blue-600 text-slate-950 flex items-center justify-center font-black text-2xl shadow-[0_0_20px_rgba(14,165,233,0.4)] shrink-0 border border-sky-200/50">
                {profile.companyName.charAt(0)}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-white tracking-tight">{profile.companyName}</h1>
                <span className="px-2.5 py-0.5 bg-sky-500/15 text-sky-300 border border-sky-500/30 rounded-full text-xs font-bold">
                  Companie Parteneră ULBS
                </span>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-3 flex-wrap">
                <span className="font-mono text-sky-300/80">CUI: {profile.cuiCif}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  {profile.city}, {profile.address}
                </span>
                {profile.contactPhone && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                      {profile.contactPhone}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Privacy Gate Activ
            </span>
          </div>
        </div>

        {/* 4 Carduri KPI Statistici Rapide */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-sky-500/15 relative z-10">
          <div className="p-3.5 bg-[#070D19]/80 rounded-2xl border border-sky-500/20 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Oferte Active
            </span>
            <span className="text-xl font-bold text-white mt-0.5 block">
              {activeOffers} <span className="text-xs font-normal text-slate-500">/ {totalOffers}</span>
            </span>
          </div>

          <div className="p-3.5 bg-[#070D19]/80 rounded-2xl border border-sky-500/20 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Aplicanți Înscriși
            </span>
            <span className="text-xl font-bold text-sky-400 mt-0.5 block">
              {totalApplicants}
            </span>
          </div>

          <div className="p-3.5 bg-[#070D19]/80 rounded-2xl border border-sky-500/20 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Candidați Ierarhizați
            </span>
            <span className="text-xl font-bold text-indigo-400 mt-0.5 block">
              {totalRanked}
            </span>
          </div>

          <div className="p-3.5 bg-[#070D19]/80 rounded-2xl border border-sky-500/20 shadow-inner">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Sloturi Interviu
            </span>
            <span className="text-xl font-bold text-emerald-400 mt-0.5 block">
              {totalSlots}
            </span>
          </div>
        </div>
      </div>

      {/* Bară de Navigare Tab-uri */}
      <div className="flex bg-[#070D19]/80 backdrop-blur-xl border border-sky-500/20 p-1.5 rounded-2xl gap-1 overflow-x-auto shadow-sm">
        <button
          onClick={() => setActiveTab("OFFERS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "OFFERS"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Briefcase className="w-4 h-4 text-sky-400" />
          <span>Oferte</span>
          {totalOffers > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
              {totalOffers}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("APPLICANTS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "APPLICANTS"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Users className="w-4 h-4 text-sky-400" />
          <span>Candidați</span>
          {totalApplicants > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
              {totalApplicants}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("INTERVIEWS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "INTERVIEWS"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>Interviuri</span>
          {totalSlots > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-500/30 text-[10px] font-bold">
              {totalSlots}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("WORKLOGS")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "WORKLOGS"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <CalendarCheck2 className="w-4 h-4 text-sky-400" />
          <span>Pontaje</span>
          {pendingLogsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse">
              {pendingLogsCount} noi
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("EVALUATION")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "EVALUATION"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Award className="w-4 h-4 text-sky-400" />
          <span>Evaluare</span>
        </button>

        <button
          onClick={() => setActiveTab("PROFILE")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === "PROFILE"
              ? "bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]"
              : "text-slate-400 hover:text-sky-200 hover:bg-sky-500/5"
          }`}
        >
          <Building2 className="w-4 h-4 text-sky-400" />
          <span>Profil Companie</span>
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

        {activeTab === "WORKLOGS" && (
          <WorkLogValidator placements={placements} />
        )}

        {activeTab === "EVALUATION" && (
          <FinalEvaluationForm
            interns={placements}
            defaultEvaluatorName={`${user.firstName} ${user.lastName}`}
          />
        )}

        {activeTab === "PROFILE" && (
          <CompanyProfileEditor profile={profile} />
        )}
      </div>
    </div>
  );
}
