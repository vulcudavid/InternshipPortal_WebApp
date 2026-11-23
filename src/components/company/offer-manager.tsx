"use client";

import { useState, useTransition } from "react";
import { upsertInternshipOffer, toggleOfferStatus, deleteOffer } from "@/app/actions/company";
import { EngineeringDomain, OfferStatus } from "@prisma/client";
import { 
  Briefcase, 
  Plus, 
  MapPin, 
  Calendar, 
  Users, 
  Tag as TagIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Edit3, 
  Trash2, 
  Power, 
  X,
  Sparkles,
  Search
} from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  domain: EngineeringDomain;
  isPredefined: boolean;
}

interface OfferTagData {
  tagId: string;
  isRequired: boolean;
  weight: number;
  tag: TagItem;
}

interface OfferItem {
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
  status: OfferStatus;
  offerTags: OfferTagData[];
  _count?: {
    preferences?: number;
    applicantRanks?: number;
    interviewSlots?: number;
    placements?: number;
  };
}

interface OfferManagerProps {
  offers: OfferItem[];
  availableTags: TagItem[];
  defaultTutorName?: string;
  defaultTutorEmail?: string;
  defaultLocation?: string;
}

const DOMAIN_LABELS: Record<EngineeringDomain, string> = {
  COMPUTER_SCIENCE_IT: "Calculatoare & IT",
  ELECTRONICS_TELECOM: "Electronică & Telecom",
  ROBOTICS_MECHATRONICS: "Robotică & Mecatronică",
  INDUSTRIAL_MANAGEMENT: "Inginerie Industrială",
  GENERAL_ENGINEERING: "Inginerie Generală",
};

export function OfferManager({
  offers,
  availableTags,
  defaultTutorName = "",
  defaultTutorEmail = "",
  defaultLocation = "Sibiu",
}: OfferManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<OfferItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDomain, setFormDomain] = useState<EngineeringDomain>(EngineeringDomain.COMPUTER_SCIENCE_IT);
  const [formSlotsTotal, setFormSlotsTotal] = useState(2);
  const [formLocation, setFormLocation] = useState(defaultLocation);
  const [formIsRemote, setFormIsRemote] = useState(false);
  const [formStartDate, setFormStartDate] = useState("2026-07-01");
  const [formEndDate, setFormEndDate] = useState("2026-09-30");
  const [formTutorName, setFormTutorName] = useState(defaultTutorName);
  const [formTutorEmail, setFormTutorEmail] = useState(defaultTutorEmail);
  const [selectedTags, setSelectedTags] = useState<{ tagId: string; isRequired: boolean; weight: number }[]>([]);

  // Tag Search & Filter
  const [tagSearch, setTagSearch] = useState("");
  const [tagDomainFilter, setTagDomainFilter] = useState<string>("ALL");

  const openCreateModal = () => {
    setEditingOffer(null);
    setFormTitle("");
    setFormDescription("");
    setFormDomain(EngineeringDomain.COMPUTER_SCIENCE_IT);
    setFormSlotsTotal(2);
    setFormLocation(defaultLocation);
    setFormIsRemote(false);
    setFormStartDate("2026-07-01");
    setFormEndDate("2026-09-30");
    setFormTutorName(defaultTutorName);
    setFormTutorEmail(defaultTutorEmail);
    setSelectedTags([]);
    setErrorMsg(null);
    setModalOpen(true);
  };

  const openEditModal = (offer: OfferItem) => {
    setEditingOffer(offer);
    setFormTitle(offer.title);
    setFormDescription(offer.description);
    setFormDomain(offer.primaryDomain);
    setFormSlotsTotal(offer.slotsTotal);
    setFormLocation(offer.location);
    setFormIsRemote(offer.isRemote);
    setFormStartDate(new Date(offer.startDate).toISOString().slice(0, 10));
    setFormEndDate(new Date(offer.endDate).toISOString().slice(0, 10));
    setFormTutorName(offer.tutorName);
    setFormTutorEmail(offer.tutorEmail);
    setSelectedTags(
      offer.offerTags.map((ot) => ({
        tagId: ot.tagId,
        isRequired: ot.isRequired,
        weight: ot.weight,
      }))
    );
    setErrorMsg(null);
    setModalOpen(true);
  };

  const toggleTagSelection = (tagId: string) => {
    const existingIndex = selectedTags.findIndex((t) => t.tagId === tagId);
    if (existingIndex >= 0) {
      setSelectedTags(selectedTags.filter((t) => t.tagId !== tagId));
    } else {
      setSelectedTags([...selectedTags, { tagId, isRequired: true, weight: 1.0 }]);
    }
  };

  const toggleTagRequirement = (tagId: string) => {
    setSelectedTags(
      selectedTags.map((t) => {
        if (t.tagId === tagId) {
          const nextRequired = !t.isRequired;
          return {
            ...t,
            isRequired: nextRequired,
            weight: nextRequired ? 1.0 : 0.8,
          };
        }
        return t;
      })
    );
  };

  const handleSaveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    startTransition(async () => {
      try {
        await upsertInternshipOffer({
          id: editingOffer ? editingOffer.id : undefined,
          title: formTitle,
          description: formDescription,
          primaryDomain: formDomain,
          slotsTotal: formSlotsTotal,
          location: formLocation,
          isRemote: formIsRemote,
          startDate: formStartDate,
          endDate: formEndDate,
          tutorName: formTutorName,
          tutorEmail: formTutorEmail,
          tags: selectedTags,
        });

        setSuccessMsg(editingOffer ? "Oferta a fost actualizată!" : "Oferta a fost publicată cu succes!");
        setModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "A apărut o eroare.");
      }
    });
  };

  const handleToggleStatus = (offerId: string) => {
    startTransition(async () => {
      try {
        await toggleOfferStatus(offerId);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Eroare la schimbarea statusului.");
      }
    });
  };

  const handleDeleteOffer = (offerId: string) => {
    if (!confirm("Sigur doriți să ștergeți această ofertă de practică?")) return;
    startTransition(async () => {
      try {
        await deleteOffer(offerId);
        setSuccessMsg("Oferta a fost ștearsă.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Eroare la ștergerea ofertei.");
      }
    });
  };

  const filteredTags = availableTags.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(tagSearch.toLowerCase().trim());
    const matchesDomain = tagDomainFilter === "ALL" || t.domain === tagDomainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="space-y-6">
      {/* Header & Buton Creare */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1221]/80 backdrop-blur-xl p-6 rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-sky-400" />
            Oferte de Practică Publicate ({offers.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Definiți pozițiile deschise, numărul de locuri și competențele cerute (obligatorii/opționale) pentru matching Gale-Shapley.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(14,165,233,0.35)] transition"
        >
          <Plus className="w-4 h-4" />
          Adaugă Ofertă Nouă
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-200 text-sm flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid Oferte */}
      {offers.length === 0 ? (
        <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border border-dashed border-sky-500/20 p-12 text-center">
          <div className="w-12 h-12 bg-sky-950/60 border border-sky-500/30 text-sky-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
            <Briefcase className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">Nu aveți nicio ofertă publicată</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-4">
            Creați prima ofertă de practică pentru a permite studenților să o aleagă în listele lor de preferințe.
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(14,165,233,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Publică Prima Ofertă
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {offers.map((offer) => {
            const isActive = offer.status === OfferStatus.ACTIVE;
            const requiredCount = offer.offerTags.filter((t) => t.isRequired).length;
            const optionalCount = offer.offerTags.filter((t) => !t.isRequired).length;

            return (
              <div
                key={offer.id}
                className={`bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border transition shadow-[0_0_25px_rgba(14,165,233,0.06)] overflow-hidden flex flex-col justify-between ${
                  isActive ? "border-sky-400/20 hover:border-sky-400/40" : "border-slate-800 bg-[#070D19]/40 opacity-75"
                }`}
              >
                <div className="p-6 space-y-4">
                  {/* Top: Status & Titlu */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            isActive
                              ? "bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                              : "bg-slate-900/60 text-slate-400 border border-slate-700/60"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" : "bg-slate-500"}`}
                          />
                          {isActive ? "Activă (Înscrieri deschise)" : "Închisă"}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-sky-950/60 text-sky-300 rounded-md font-semibold border border-sky-500/30">
                          {DOMAIN_LABELS[offer.primaryDomain]}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white leading-snug">{offer.title}</h3>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title={isActive ? "Dezactivează oferta" : "Activează oferta"}
                        onClick={() => handleToggleStatus(offer.id)}
                        disabled={isPending}
                        className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 rounded-lg transition"
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button
                        title="Editează"
                        onClick={() => openEditModal(offer)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 rounded-lg transition"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        title="Șterge"
                        onClick={() => handleDeleteOffer(offer.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">{offer.description}</p>

                  {/* Informații cheie */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-2 border-t border-sky-500/15">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        <strong className="text-white">{offer.slotsTotal}</strong> locuri ({offer.slotsAvailable} libere)
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span className="truncate">{offer.location} {offer.isRemote && "(Remote)"}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-400" />
                      <span>
                        {new Date(offer.startDate).toLocaleDateString("ro-RO")} – {new Date(offer.endDate).toLocaleDateString("ro-RO")}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-semibold text-sky-300">Tutore:</span>
                      <span className="truncate">{offer.tutorName}</span>
                    </div>
                  </div>

                  {/* Competențe cerute */}
                  <div className="space-y-1.5 pt-2 border-t border-sky-500/15">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                      <span>Competențe Cerute ({offer.offerTags.length})</span>
                      <span>{requiredCount} Obligatorii • {optionalCount} Opționale</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                      {offer.offerTags.map((ot) => (
                        <span
                          key={ot.tagId}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            ot.isRequired
                              ? "bg-rose-950/40 text-rose-300 border border-rose-500/30"
                              : "bg-[#070D19] text-slate-300 border border-sky-500/20"
                          }`}
                        >
                          <TagIcon className="w-2.5 h-2.5 text-sky-400" />
                          {ot.tag.name}
                          <span className="text-[9px] font-bold opacity-75">
                            {ot.isRequired ? "(Obligatoriu)" : "(Opțional)"}
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer Metrics */}
                <div className="px-6 py-3 bg-[#070D19]/70 border-t border-sky-500/15 text-xs text-slate-400 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span>
                      <strong className="text-white">{offer._count?.preferences || 0}</strong> aplicanți
                    </span>
                    <span>
                      <strong className="text-white">{offer._count?.applicantRanks || 0}</strong> ierarhizați
                    </span>
                    <span>
                      <strong className="text-white">{offer._count?.interviewSlots || 0}</strong> sloturi interviu
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Creare / Editare Ofertă */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-[#0B1221] rounded-2xl border border-sky-400/30 shadow-[0_0_50px_rgba(14,165,233,0.15)] w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-sky-500/20 flex items-center justify-between bg-[#070D19]/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingOffer ? "Editează Oferta de Practică" : "Publică Ofertă Nouă de Practică"}
                  </h3>
                  <p className="text-xs text-slate-400">Completați detaliile poziției și competențele tehnice căutate</p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveOffer} className="p-6 overflow-y-auto space-y-6 flex-1">
              {errorMsg && (
                <div className="p-3 bg-rose-950/40 border border-rose-500/40 rounded-xl text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Titlu */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Titlu Ofertă / Poziție <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Ex: Junior Embedded & Cloud Developer"
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                  />
                </div>

                {/* Domeniu Principal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Domeniu Ingineresc Principal <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formDomain}
                    onChange={(e) => setFormDomain(e.target.value as EngineeringDomain)}
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400"
                  >
                    {Object.entries(DOMAIN_LABELS).map(([domainKey, label]) => (
                      <option key={domainKey} value={domainKey}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Număr Locuri */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Locuri Disponibile (Capacitate Gale-Shapley) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    required
                    value={formSlotsTotal}
                    onChange={(e) => setFormSlotsTotal(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 font-mono"
                  />
                </div>

                {/* Locație */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Locație Sediu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Ex: Sibiu, Str. Salzburg 8"
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                  />
                </div>

                {/* Mod Remote */}
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isRemote"
                    checked={formIsRemote}
                    onChange={(e) => setFormIsRemote(e.target.checked)}
                    className="w-4 h-4 text-sky-500 bg-[#070D19] rounded border-sky-500/30 focus:ring-sky-400"
                  />
                  <label htmlFor="isRemote" className="text-xs font-medium text-slate-300 cursor-pointer">
                    Permite lucru Remote / Hibrid
                  </label>
                </div>

                {/* Perioadă */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Data Început Stagiu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Data Finalizare Stagiu <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400"
                  />
                </div>

                {/* Tutore */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nume Tutore / Coordonator Firmă <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formTutorName}
                    onChange={(e) => setFormTutorName(e.target.value)}
                    placeholder="Ex: Ing. Elena Popa"
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Email Tutore <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formTutorEmail}
                    onChange={(e) => setFormTutorEmail(e.target.value)}
                    placeholder="elena.popa@firma.ro"
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                  />
                </div>

                {/* Descriere */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Descriere Activitate & Proiect de Practică <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Descrieți pe scurt proiectele în care va fi implicat studentul, tehnologiile utilizate și obiectivele de învățare..."
                    className="w-full px-3 py-2 text-sm bg-[#070D19] border border-sky-500/30 text-white rounded-xl focus:outline-none focus:border-sky-400 placeholder-slate-500"
                  />
                </div>
              </div>

              {/* Selector Competențe */}
              <div className="space-y-3 pt-4 border-t border-sky-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="block text-xs font-bold text-white uppercase tracking-wider">
                      Competențe Cerute ({selectedTags.length} selectate)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Tag-urile <strong>Obligatorii</strong> asigură 70% din scorul de compatibilitate; cele <strong>Opționale</strong> aduc 20%.
                    </p>
                  </div>
                </div>

                {/* Filtru Căutare & Domenii */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Caută în catalogul de 41 de competențe..."
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#070D19] border border-sky-500/30 text-white rounded-lg focus:outline-none focus:border-sky-400 placeholder-slate-500"
                    />
                  </div>

                  <select
                    value={tagDomainFilter}
                    onChange={(e) => setTagDomainFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-[#070D19] border border-sky-500/30 text-white rounded-lg focus:outline-none focus:border-sky-400"
                  >
                    <option value="ALL">Toate Domeniile</option>
                    {Object.entries(DOMAIN_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag Cloud Selector */}
                <div className="p-3 bg-[#070D19]/80 border border-sky-500/20 rounded-xl max-h-48 overflow-y-auto flex flex-wrap gap-1.5">
                  {filteredTags.map((t) => {
                    const isSelected = selectedTags.some((st) => st.tagId === t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTagSelection(t.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                          isSelected
                            ? "bg-sky-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(14,165,233,0.35)]"
                            : "bg-[#0B1221] text-slate-300 border border-sky-500/20 hover:border-sky-400/40 hover:text-white"
                        }`}
                      >
                        <TagIcon className="w-3 h-3" />
                        <span>{t.name}</span>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                      </button>
                    );
                  })}
                </div>

                {/* Lista de Competențe Selectate cu Setare Obligatoriu / Opțional */}
                {selectedTags.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                      Configurează cerințele pe competențele alese:
                    </span>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto">
                      {selectedTags.map((st) => {
                        const tagObj = availableTags.find((t) => t.id === st.tagId);
                        if (!tagObj) return null;

                        return (
                          <div
                            key={st.tagId}
                            className="flex items-center justify-between p-2 bg-[#070D19] rounded-lg border border-sky-500/20 text-xs"
                          >
                            <span className="font-semibold text-white">{tagObj.name}</span>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => toggleTagRequirement(st.tagId)}
                                className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                                  st.isRequired
                                    ? "bg-rose-950/60 text-rose-300 border border-rose-500/40"
                                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:border-slate-500"
                                }`}
                              >
                                {st.isRequired ? "★ Obligatorie (70% scor)" : "○ Opțională (20% scor)"}
                              </button>

                              <button
                                type="button"
                                onClick={() => toggleTagSelection(st.tagId)}
                                className="text-slate-400 hover:text-rose-400 p-1"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end gap-2 pt-4 border-t border-sky-500/20">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl text-xs font-semibold"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl text-xs font-bold shadow-[0_0_20px_rgba(14,165,233,0.35)] transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />}
                  <span>{editingOffer ? "Salvează Modificările" : "Publică Oferta"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
