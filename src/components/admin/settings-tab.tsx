"use client";

import React, { useState, useEffect } from "react";
import { Sliders, Save, Clock, HelpCircle, CheckCircle2, Loader2, RotateCcw } from "lucide-react";

interface Props {
  onNotify: (msg: string, type: "success" | "error") => void;
}

export function SettingsTab({ onNotify }: Props) {
  const [requiredHours, setRequiredHours] = useState<number>(120);
  const [tieBreakerRule, setTieBreakerRule] = useState<"APPLICATION_ORDER" | "ACADEMIC_SCORE">(
    "APPLICATION_ORDER"
  );
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        throw new Error("Nu s-au putut prelua setările globale de practică.");
      }
      const data = await res.json();
      if (data.settings) {
        setRequiredHours(data.settings.requiredHours);
        setTieBreakerRule(data.settings.tieBreakerRule);
        setUpdatedAt(data.settings.updatedAt);
      }
    } catch (err: any) {
      onNotify(err.message || "Eroare la preluarea setărilor.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiredHours <= 0 || !Number.isInteger(Number(requiredHours))) {
      onNotify("Numărul de ore obligatorii trebuie să fie un număr întreg pozitiv.", "error");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requiredHours: Number(requiredHours),
          tieBreakerRule,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Eroare la salvarea setărilor.");
      }

      onNotify(
        data.message || "Regulile globale de practică au fost salvate cu succes!",
        "success"
      );
      if (data.settings) {
        setUpdatedAt(data.settings.updatedAt);
      }
    } catch (err: any) {
      onNotify(err.message || "Eroare la salvarea setărilor.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Reguli Globale de Stagiu de Practică
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parametri instituționali aplicați la nivelul Facultății de Inginerie ULBS pentru pontaje și algoritmul Gale-Shapley.
          </p>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <span>Se încarcă configurările...</span>
          </div>
        ) : (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. Număr Total Ore Obligatorii */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    Număr Total de Ore Obligatorii de Practică (<code>required_hours</code>)
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Totalul minim de ore validate în jurnalele de pontaj pentru obținerea calificativului la colocviu.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={500}
                    step={1}
                    value={requiredHours}
                    onChange={(e) => setRequiredHours(Number(e.target.value))}
                    required
                    className="w-24 text-center font-bold text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
                  />
                  <span className="text-xs font-semibold text-slate-500">ore</span>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 bg-white dark:bg-slate-800/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                Standard ULBS: <strong>120 ore</strong> (echivalentul a 3-4 săptămâni de stagiu cu normă întreagă).
              </div>
            </div>

            {/* 2. Criteriu Departajare Gale-Shapley */}
            <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-emerald-600" />
                  Regula de Departajare Automatizată (<code>tie_breaker_rule</code>)
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Se aplică în algoritmul Gale-Shapley dacă o firmă parteneră nu a clasificat manual candidații înscriși la oferta sa.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Opțiunea A */}
                <label
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    tieBreakerRule === "APPLICATION_ORDER"
                      ? "bg-white dark:bg-slate-800/90 border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                      : "bg-white/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        APPLICATION_ORDER
                      </span>
                      <input
                        type="radio"
                        name="tieBreakerRule"
                        value="APPLICATION_ORDER"
                        checked={tieBreakerRule === "APPLICATION_ORDER"}
                        onChange={() => setTieBreakerRule("APPLICATION_ORDER")}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      Principiul „Primul venit, primul servit” (FIFO)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      Candidații neclasificați de companie sunt ordonați cronologic după momentul adăugării ofertei în preferințele lor.
                    </p>
                  </div>
                </label>

                {/* Opțiunea B */}
                <label
                  className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                    tieBreakerRule === "ACADEMIC_SCORE"
                      ? "bg-white dark:bg-slate-800/90 border-blue-500 shadow-xs ring-1 ring-blue-500/30"
                      : "bg-white/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        ACADEMIC_SCORE
                      </span>
                      <input
                        type="radio"
                        name="tieBreakerRule"
                        value="ACADEMIC_SCORE"
                        checked={tieBreakerRule === "ACADEMIC_SCORE"}
                        onChange={() => setTieBreakerRule("ACADEMIC_SCORE")}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                      Punctaj Academic & Compatibilitate
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                      Departajarea se face pe baza scorului de potrivire tehnică (tag-uri de competență dobândite conform catalogului ULBS).
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer Formular */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80 dark:border-slate-800">
              <div className="text-[11px] text-slate-400">
                {updatedAt ? (
                  <span>
                    Ultima actualizare salvată:{" "}
                    <strong>
                      {new Date(updatedAt).toLocaleString("ro-RO", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </strong>
                  </span>
                ) : (
                  <span>Setări în starea implicită de sistem.</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchSettings}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resetează</span>
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Salvează Modificările</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
