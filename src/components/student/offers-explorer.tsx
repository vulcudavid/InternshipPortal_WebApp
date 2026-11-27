"use client";

import { useState, useTransition } from "react";
import { EngineeringDomain, ProficiencyLevel } from "@prisma/client";
import { 
  calculateCompatibilityScore, 
  CompatibilityResult 
} from "@/lib/scoring";
import { addStudentPreference, bookInterviewSlot, cancelInterviewBooking } from "@/app/actions/student";
import { 
  Building2, 
  MapPin, 
  Users, 
  Calendar, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  Search, 
  ExternalLink,
  Briefcase,
  AlertCircle,
  HelpCircle,
  Clock,
  Video,
  UserCheck
} from "lucide-react";

export interface OfferData {
  id: string;
  title: string;
  description: string;
  primaryDomain: EngineeringDomain | null;
  domains?: EngineeringDomain[];
  slotsTotal: number;
  slotsAvailable: number;
  location: string;
  isRemote: boolean;
  startDate: Date | string;
  endDate: Date | string;
  tutorName: string;
  tutorEmail: string;
  company: {
    id: string;
    companyName: string;
    city: string;
    website?: string | null;
  };
  offerTags: {
    tagId: string;
    isRequired: boolean;
    weight: number;
    tag: {
      name: string;
      domain: EngineeringDomain;
    };
  }[];
  interviewSlots?: {
    id: string;
    startTime: Date | string;
    endTime: Date | string;
    meetingLink?: string | null;
    isBooked: boolean;
    studentId?: string | null;
  }[];
}

interface OffersExplorerProps {
  offers: OfferData[];
  studentDomain: EngineeringDomain;
  studentSkills: {
    tagId: string;
    tagName: string;
    domain: EngineeringDomain;
    proficiency: ProficiencyLevel;
  }[];
  preferredOfferIds: string[];
  preferencesRankMap: Record<string, number>;
  currentStudentId?: string;
}

export function OffersExplorer({
  offers,
  studentDomain,
  studentSkills,
  preferredOfferIds,
  preferencesRankMap,
  currentStudentId,
}: OffersExplorerProps) {
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "slots">("score");
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const evaluatedOffers = offers.map((offer) => {
    const offerTagInputs = offer.offerTags.map((ot) => ({
      tagId: ot.tagId,
      tagName: ot.tag.name,
      domain: ot.tag.domain,
      isRequired: ot.isRequired,
      weight: ot.weight,
    }));

    const offerDomains =
      offer.domains && offer.domains.length > 0
        ? offer.domains
        : offer.primaryDomain;

    const compatibility: CompatibilityResult = calculateCompatibilityScore(
      studentDomain,
      studentSkills,
      offerDomains,
      offerTagInputs
    );

    return {
      ...offer,
      compatibility,
      isPreferred: preferredOfferIds.includes(offer.id),
      preferenceRank: preferencesRankMap[offer.id] || null,
    };
  });

  function offerPrimaryDomain(domain: EngineeringDomain): EngineeringDomain {
    return domain;
  }

  const filteredOffers = evaluatedOffers
    .filter((offer) => {
      const q = searchTerm.toLowerCase();
      return (
        offer.title.toLowerCase().includes(q) ||
        offer.company.companyName.toLowerCase().includes(q) ||
        offer.location.toLowerCase().includes(q) ||
        offer.offerTags.some((t) => t.tag.name.toLowerCase().includes(q))
      );
    })
    .sort((a, b) => {
      if (sortBy === "score") {
        return b.compatibility.score - a.compatibility.score;
      }
      return b.slotsAvailable - a.slotsAvailable;
    });

  const handleAddPreference = (offerId: string, offerTitle: string) => {
    startTransition(async () => {
      try {
        const res = await addStudentPreference(offerId);
        if (res.success) {
          setSuccessNotice(`Oferta "${offerTitle}" a fost adăugată la opțiunea #${res.rank}!`);
          setTimeout(() => setSuccessNotice(null), 4000);
        }
      } catch (err: unknown) {
        console.error(err);
      }
    });
  };

  const handleBookSlot = (slotId: string) => {
    startTransition(async () => {
      try {
        await bookInterviewSlot(slotId);
        setSuccessNotice("Slotul de interviu a fost rezervat cu succes!");
        setTimeout(() => setSuccessNotice(null), 4000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Eroare la rezervarea slotului.");
      }
    });
  };

  const handleCancelSlot = (slotId: string) => {
    startTransition(async () => {
      try {
        await cancelInterviewBooking(slotId);
        setSuccessNotice("Rezervarea slotului a fost anulată.");
        setTimeout(() => setSuccessNotice(null), 3000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Eroare la anularea rezervării.");
      }
    });
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) {
      return "bg-emerald-950/50 text-emerald-300 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.2)]";
    }
    if (score >= 60) {
      return "bg-sky-950/50 text-sky-300 border-sky-500/40 shadow-[0_0_15px_rgba(14,165,233,0.2)]";
    }
    return "bg-amber-950/50 text-amber-300 border-amber-500/40";
  };

  return (
    <div className="space-y-6">
      {/* Header & Filtre */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              Explorare Oferte de Practică & Potrivire Inteligentă
            </h3>
            <p className="text-xs text-slate-400">
              Scorurile sunt calculate live pe baza competențelor tale din profil și cerințelor companiilor.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-sky-950/60 text-sky-300 rounded-full border border-sky-500/30 self-start sm:self-auto shadow-xs">
            {filteredOffers.length} oferte disponibile
          </span>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută după titlu, companie, tehnologie sau oraș..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-sky-500/30 bg-[#070D19] text-white placeholder-slate-500 pl-8 focus:outline-none focus:border-sky-400"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Sortează după:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "slots")}
              className="text-xs px-3 py-2 rounded-xl border border-sky-500/30 bg-[#070D19] text-white font-medium focus:outline-none focus:border-sky-400"
            >
              <option value="score">Scor compatibilitate (cel mai mare)</option>
              <option value="slots">Locuri disponibile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista Cardurilor de Oferte */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => {
          const comp = offer.compatibility;
          return (
            <div
              key={offer.id}
              className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] hover:border-sky-400/40 transition p-6 space-y-4"
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-sky-400" />
                      {offer.company.companyName}
                    </span>
                    {offer.isRemote && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/50 text-purple-300 border border-purple-500/30">
                        Remote / Hibrid
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-white text-lg leading-snug">
                    {offer.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      {offer.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      {offer.slotsAvailable} din {offer.slotsTotal} locuri libere
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      {new Date(offer.startDate).toLocaleDateString("ro-RO", { month: "short", year: "numeric" })} -{" "}
                      {new Date(offer.endDate).toLocaleDateString("ro-RO", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                {/* Badge Scor Compatibilitate */}
                <div className="sm:text-right shrink-0">
                  <div
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-2xl border text-xs font-extrabold ${getScoreBadge(
                      comp.score
                    )}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>{comp.score}% Compatibil</span>
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Calculat prin algoritm Gale-Shapley ULBS
                  </span>
                </div>
              </div>

              {/* Descriere */}
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                {offer.description}
              </p>

              <div className="flex flex-wrap gap-1.5">
                  {offer.offerTags.length === 0 ? (
                    <span className="text-xs px-2.5 py-1 rounded-lg border bg-emerald-950/30 text-emerald-300 border-emerald-500/30">
                      Fără cerințe tehnice prealabile – deschis tuturor studenților
                    </span>
                  ) : (
                    offer.offerTags.map((ot) => {
                      const isMatched = comp.matchedRequiredTags.includes(ot.tag.name) ||
                                       comp.matchedOptionalTags.includes(ot.tag.name);
                      return (
                        <span
                          key={ot.tagId}
                          className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                            isMatched
                              ? "bg-emerald-950/40 text-emerald-300 border-emerald-500/40 font-semibold"
                              : ot.isRequired
                              ? "bg-rose-950/40 text-rose-300 border-rose-500/40"
                              : "bg-slate-900/60 text-slate-300 border-slate-700/60"
                          }`}
                        >
                          {isMatched ? (
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ) : ot.isRequired ? (
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                          ) : null}
                          <span>{ot.tag.name}</span>
                          {ot.isRequired && (
                            <span className="text-[9px] opacity-75 font-normal">(obligatoriu)</span>
                          )}
                        </span>
                      );
                    })
                  )}
                </div>
                
              {/* Sloturi Interviu Disponibile */}
              {offer.interviewSlots && offer.interviewSlots.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-sky-500/15">
                  <div className="flex items-center justify-between text-[11px] font-bold text-sky-300 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      Sloturi Interviu Disponibile ({offer.interviewSlots.length})
                    </span>
                    {!offer.isPreferred && (
                      <span className="text-[10px] text-amber-400 font-semibold lowercase">
                        (adaugă oferta la preferințe pentru a rezerva)
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {offer.interviewSlots.map((slot) => {
                      const isMine = currentStudentId && slot.studentId === currentStudentId;
                      const isAvailable = !slot.isBooked;
                      const sDate = new Date(slot.startTime);
                      const eDate = new Date(slot.endTime);

                      return (
                        <div
                          key={slot.id}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                            isMine
                              ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-200"
                              : isAvailable
                              ? "bg-[#070D19]/70 border-sky-500/20 text-slate-200"
                              : "bg-[#070D19]/40 border-slate-800 text-slate-500 opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-sky-400" />
                              <span>
                                {sDate.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })},{" "}
                                {sDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} -{" "}
                                {eDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {slot.meetingLink && (
                              <div className="text-[10px] text-slate-400 truncate max-w-[180px]">
                                {slot.meetingLink}
                              </div>
                            )}
                          </div>

                          <div>
                            {isMine ? (
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleCancelSlot(slot.id)}
                                className="px-2 py-1 bg-rose-950/40 border border-rose-500/30 text-rose-300 hover:bg-rose-900/50 rounded-lg text-[10px] font-bold"
                              >
                                Anulează
                              </button>
                            ) : isAvailable ? (
                              <button
                                type="button"
                                disabled={!offer.isPreferred || isPending}
                                onClick={() => handleBookSlot(slot.id)}
                                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 rounded-lg text-[10px] font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                              >
                                Rezervă
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-500">Ocupat</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Card: Tutore & Acțiune Preferință */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-sky-500/15">
                <span className="text-xs text-slate-400">
                  Tutore desemnat: <strong className="text-slate-200">{offer.tutorName}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {offer.isPreferred ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-950/40 text-purple-300 border border-purple-500/30 text-xs font-bold shadow-[0_0_10px_rgba(168,85,247,0.15)]">
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                      <span>În preferințele tale (Opțiunea #{offer.preferenceRank})</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleAddPreference(offer.id, offer.title)}
                      className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(14,165,233,0.35)]"
                    >
                      <Plus className="w-4 h-4" />
                      Adaugă la Preferințe
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredOffers.length === 0 && (
          <div className="p-8 text-center bg-[#0B1221]/88 rounded-2xl border border-sky-400/20 text-slate-400 text-xs">
            Nu a fost găsită nicio ofertă care să corespundă criteriilor de căutare.
          </div>
        )}
      </div>
    </div>
  );
}
