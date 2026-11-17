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
  primaryDomain: EngineeringDomain;
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
  preferredOfferIds: string[]; // ID-urile ofertelor deja adăugate în StudentPreference
  preferencesRankMap: Record<string, number>; // offerId -> rank
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

  // Calculăm scorul de compatibilitate pentru fiecare ofertă
  const evaluatedOffers = offers.map((offer) => {
    const offerTagInputs = offer.offerTags.map((ot) => ({
      tagId: ot.tagId,
      tagName: ot.tag.name,
      domain: ot.tag.domain,
      isRequired: ot.isRequired,
      weight: ot.weight,
    }));

    const compatibility: CompatibilityResult = calculateCompatibilityScore(
      studentDomain,
      studentSkills,
      offerPrimaryDomain(offer.primaryDomain),
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

  // Filtrare & Sortare
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
      return "bg-emerald-50 text-emerald-700 border-emerald-300";
    }
    if (score >= 60) {
      return "bg-blue-50 text-blue-700 border-blue-300";
    }
    return "bg-amber-50 text-amber-700 border-amber-300";
  };

  return (
    <div className="space-y-6">
      {/* Header & Filtre */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              Explorare Oferte de Practică & Potrivire Inteligentă
            </h3>
            <p className="text-xs text-slate-500">
              Scorurile sunt calculate live pe baza competențelor tale din profil și cerințelor companiilor.
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200 self-start sm:self-auto">
            {filteredOffers.length} oferte disponibile
          </span>
        </div>

        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Sortează după:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "slots")}
              className="text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition p-6 space-y-4"
            >
              {/* Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {offer.company.companyName}
                    </span>
                    {offer.isRemote && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Remote / Hibrid
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-900 text-lg leading-snug">
                    {offer.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {offer.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      {offer.slotsAvailable} din {offer.slotsTotal} locuri libere
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
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
                    Calculat prin algoritm P14
                  </span>
                </div>
              </div>

              {/* Descriere */}
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {offer.description}
              </p>

              {/* Breakdown Competențe Cerute & Potrivire */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                  Competențe Cerute de Companie:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {offer.offerTags.map((ot) => {
                    const isMatched = comp.matchedRequiredTags.includes(ot.tag.name) ||
                                     comp.matchedOptionalTags.includes(ot.tag.name);
                    return (
                      <span
                        key={ot.tagId}
                        className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 ${
                          isMatched
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold"
                            : ot.isRequired
                            ? "bg-rose-50/70 text-rose-700 border-rose-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {isMatched ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : ot.isRequired ? (
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                        ) : null}
                        <span>{ot.tag.name}</span>
                        {ot.isRequired && (
                          <span className="text-[9px] opacity-75 font-normal">(obligatoriu)</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Sloturi Interviu Disponibile */}
              {offer.interviewSlots && offer.interviewSlots.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      Sloturi Interviu Disponibile ({offer.interviewSlots.length})
                    </span>
                    {!offer.isPreferred && (
                      <span className="text-[10px] text-amber-600 font-semibold lowercase">
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
                              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                              : isAvailable
                              ? "bg-slate-50 border-slate-200 text-slate-700"
                              : "bg-slate-100 border-slate-200 text-slate-400 opacity-60"
                          }`}
                        >
                          <div className="space-y-0.5">
                            <div className="font-semibold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {sDate.toLocaleDateString("ro-RO", { day: "numeric", month: "short" })},{" "}
                                {sDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} -{" "}
                                {eDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            {slot.meetingLink && (
                              <div className="text-[10px] text-slate-500 truncate max-w-[180px]">
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
                                className="px-2 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold"
                              >
                                Anulează
                              </button>
                            ) : isAvailable ? (
                              <button
                                type="button"
                                disabled={!offer.isPreferred || isPending}
                                onClick={() => handleBookSlot(slot.id)}
                                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-[10px] font-bold shadow-2xs"
                              >
                                Rezervă
                              </button>
                            ) : (
                              <span className="text-[10px] font-semibold text-slate-400">Ocupat</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer Card: Tutore & Acțiune Preferință */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  Tutore desemnat: <strong className="text-slate-700">{offer.tutorName}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {offer.isPreferred ? (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      <span>În preferințele tale (Opțiunea #{offer.preferenceRank})</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleAddPreference(offer.id, offer.title)}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
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
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
            Nu a fost găsită nicio ofertă care să corespundă criteriilor de căutare.
          </div>
        )}
      </div>
    </div>
  );
}
