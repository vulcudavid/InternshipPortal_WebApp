"use client";

import { useState, useTransition } from "react";
import { 
  removeStudentPreference, 
  reorderStudentPreferences 
} from "@/app/actions/student";
import { 
  ListOrdered, 
  ArrowUp, 
  ArrowDown, 
  Trash2, 
  Building2, 
  MapPin, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle
} from "lucide-react";

export interface PreferenceItem {
  id: string;
  rank: number;
  offerId: string;
  offer: {
    id: string;
    title: string;
    location: string;
    slotsAvailable: number;
    company: {
      companyName: string;
    };
  };
}

interface PreferencesManagerProps {
  preferences: PreferenceItem[];
}

export function PreferencesManager({ preferences: initialPreferences }: PreferencesManagerProps) {
  const [isPending, startTransition] = useTransition();
  const [preferences, setPreferences] = useState<PreferenceItem[]>(
    [...initialPreferences].sort((a, b) => a.rank - b.rank)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleMove = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === preferences.length - 1)
    ) {
      return;
    }

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const newItems = [...preferences];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    const updated = newItems.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));

    setPreferences(updated);

    startTransition(async () => {
      try {
        await reorderStudentPreferences(updated.map((u) => u.id));
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "Eroare la reordonarea preferințelor.");
      }
    });
  };

  const handleRemove = (preferenceId: string) => {
    const remaining = preferences
      .filter((p) => p.id !== preferenceId)
      .map((p, idx) => ({ ...p, rank: idx + 1 }));

    setPreferences(remaining);

    startTransition(async () => {
      try {
        await removeStudentPreference(preferenceId);
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "Eroare la eliminarea preferinței.");
      }
    });
  };

  return (
    <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
      {/* Header Secțiune & Contor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-purple-400" />
            Preferințele Mele Ordonate (Clasament Gale-Shapley)
          </h3>
          <p className="text-xs text-slate-400">
            Ordinea opțiunilor este crucială: algoritmul stabil va încerca să te aloce la prima ta opțiune posibilă.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-950/40 text-purple-300 border border-purple-500/30">
            {preferences.length} {preferences.length === 1 ? "preferință exprimată" : "preferințe exprimate"} (Nelimitat)
          </span>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Alertă explicativă algoritm Gale-Shapley */}
      <div className="p-4 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-1.5 text-xs text-slate-300">
        <div className="flex items-center gap-1.5 font-bold text-sky-300">
          <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
          <span>Cum funcționează algoritmul stabil de matching?</span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Platforma folosește varianta <em>Student-Proposing Deferred Acceptance (Gale-Shapley)</em>. 
          Poziția <strong>#1</strong> are prioritate absolută pentru tine. Dacă locurile de la Opțiunea #1 sunt ocupate de candidați cu clasament mai bun, ești propus automat pentru Opțiunea #2, și așa mai departe.
        </p>
      </div>

      {/* Lista Preferințelor */}
      {preferences.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-sky-500/20 rounded-2xl bg-[#070D19]/60 text-xs text-slate-400 space-y-2">
          <p className="font-semibold text-white">Nu ai adăugat nicio ofertă la preferințe.</p>
          <p>Mergi în secțiunea „Explorare Oferte” și apasă pe butonul <strong className="text-sky-300">„Adaugă la Preferințe”</strong> pe pozițiile dorite.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {preferences.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 rounded-xl border border-sky-500/20 bg-[#070D19]/80 hover:border-purple-400/40 transition shadow-inner"
            >
              {/* Rang & Detalii Ofertă */}
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.4)]">
                  #{item.rank}
                </div>

                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block truncate">
                    {item.offer.company.companyName}
                  </span>
                  <h5 className="font-bold text-white text-sm truncate">
                    {item.offer.title}
                  </h5>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-sky-400" />
                      {item.offer.location}
                    </span>
                    <span>•</span>
                    <span>{item.offer.slotsAvailable} locuri libere</span>
                  </div>
                </div>
              </div>

              {/* Butoane Acțiune (Sus, Jos, Șterge) */}
              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button
                  type="button"
                  disabled={isPending || index === 0}
                  onClick={() => handleMove(index, "up")}
                  className="p-1.5 rounded-lg border border-sky-500/20 bg-[#0B1221] hover:bg-sky-500/10 disabled:opacity-20 disabled:pointer-events-none text-slate-300 hover:text-white transition"
                  title="Mută mai sus în preferințe"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={isPending || index === preferences.length - 1}
                  onClick={() => handleMove(index, "down")}
                  className="p-1.5 rounded-lg border border-sky-500/20 bg-[#0B1221] hover:bg-sky-500/10 disabled:opacity-20 disabled:pointer-events-none text-slate-300 hover:text-white transition"
                  title="Mută mai jos în preferințe"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded-lg border border-rose-500/30 bg-[#0B1221] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 transition ml-1"
                  title="Elimină din preferințe"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
