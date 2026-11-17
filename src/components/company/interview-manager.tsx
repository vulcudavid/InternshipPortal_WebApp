"use client";

import { useState, useTransition } from "react";
import { createInterviewSlot, deleteInterviewSlot } from "@/app/actions/company";
import { 
  Calendar, 
  Clock, 
  Video, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  UserCheck, 
  Users, 
  X,
  ExternalLink,
  MapPin
} from "lucide-react";

interface BookedStudent {
  id: string;
  specialization: string;
  studyYear: number;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface InterviewSlotData {
  id: string;
  offerId: string;
  startTime: Date | string;
  endTime: Date | string;
  meetingLink?: string | null;
  isBooked: boolean;
  student?: BookedStudent | null;
}

interface OfferWithSlots {
  id: string;
  title: string;
  interviewSlots: InterviewSlotData[];
}

interface InterviewManagerProps {
  offers: OfferWithSlots[];
}

export function InterviewManager({ offers }: InterviewManagerProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string>(offers[0]?.id || "");
  const [isPending, startTransition] = useTransition();
  const [modalOpen, setModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [slotDate, setSlotDate] = useState("2026-06-15");
  const [slotStartTime, setSlotStartTime] = useState("10:00");
  const [slotEndTime, setSlotEndTime] = useState("10:45");
  const [slotMeetingLink, setSlotMeetingLink] = useState("https://meet.google.com/demo-slot");

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0];

  if (!selectedOffer) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <Calendar className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm">Nu există nicio ofertă publicată pentru a programa interviuri.</p>
      </div>
    );
  }

  const handleCreateSlot = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const startDateTime = new Date(`${slotDate}T${slotStartTime}:00`);
    const endDateTime = new Date(`${slotDate}T${slotEndTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      setErrorMsg("Data sau orele introduse sunt invalide.");
      return;
    }

    if (startDateTime >= endDateTime) {
      setErrorMsg("Ora de început trebuie să fie anterioară orei de sfârșit.");
      return;
    }

    startTransition(async () => {
      try {
        await createInterviewSlot({
          offerId: selectedOffer.id,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          meetingLink: slotMeetingLink,
        });

        setSuccessMsg("Slotul de interviu a fost adăugat cu succes!");
        setModalOpen(false);
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "A apărut o eroare la salvare.");
      }
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (!confirm("Sigur doriți să ștergeți acest slot de interviu?")) return;
    startTransition(async () => {
      try {
        await deleteInterviewSlot(slotId);
        setSuccessMsg("Slotul a fost șters.");
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : "Eroare la ștergerea slotului.");
      }
    });
  };

  const sortedSlots = [...selectedOffer.interviewSlots].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Header & Selector */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Selectează Oferta pentru Programare Interviuri
          </label>
          <select
            value={selectedOffer.id}
            onChange={(e) => setSelectedOfferId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} ({o.interviewSlots.length} sloturi create)
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          Adaugă Slot Interviu
        </button>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Listă Sloturi */}
      {sortedSlots.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nu aveți niciun slot de interviu creat</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Definiți intervale orare pentru interviurile tehnice. Studenții care au aplicat vor putea alege un interval direct din platformă.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Creează Primul Slot
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSlots.map((slot) => {
            const startDate = new Date(slot.startTime);
            const endDate = new Date(slot.endTime);
            const isBooked = slot.isBooked && !!slot.student;

            return (
              <div
                key={slot.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 transition flex flex-col justify-between ${
                  isBooked ? "border-emerald-200 bg-emerald-50/20" : "border-slate-200/80 hover:border-blue-300"
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isBooked
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      }`}
                    >
                      {isBooked ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Rezervat</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <span>Disponibil</span>
                        </>
                      )}
                    </span>

                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={isPending}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                      title="Șterge slot"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dată & Interval Orar */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span>
                        {startDate.toLocaleDateString("ro-RO", {
                          weekday: "short",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {startDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })} –{" "}
                        {endDate.toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Link / Locație */}
                  {slot.meetingLink && (
                    <div className="text-xs text-slate-600 flex items-center gap-1.5 truncate bg-slate-50 p-2 rounded-lg">
                      <Video className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {slot.meetingLink.startsWith("http") ? (
                        <a
                          href={slot.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {slot.meetingLink}
                        </a>
                      ) : (
                        <span className="truncate">{slot.meetingLink}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Footer: Date Student dacă e rezervat */}
                <div className="pt-3 border-t border-slate-100 text-xs">
                  {isBooked && slot.student ? (
                    <div className="space-y-0.5 text-slate-700">
                      <div className="font-bold text-emerald-900 flex items-center gap-1">
                        <span>
                          {slot.student.user.firstName} {slot.student.user.lastName}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {slot.student.specialization} • {slot.student.user.email}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-400 italic">
                      Așteaptă rezervare de la aplicanți
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Adăugare Slot */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">Adaugă Slot Nou de Interviu</h3>
              </div>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Data Interviului <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Ora Început <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={slotStartTime}
                    onChange={(e) => setSlotStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Ora Sfârșit <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="time"
                    required
                    value={slotEndTime}
                    onChange={(e) => setSlotEndTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Link Întâlnire Online sau Sală / Locație
                </label>
                <input
                  type="text"
                  value={slotMeetingLink}
                  onChange={(e) => setSlotMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/... sau Sala 204 Sediu"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  Anulează
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Adaugă Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
