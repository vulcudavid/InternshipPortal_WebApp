"use client";

import React, { useState, useTransition, useEffect } from "react";
import { submitFinalEvaluation } from "@/app/actions/evaluation";
import {
  Award,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Save,
  Tag,
  Plus,
  X,
  Star,
  FileCheck,
} from "lucide-react";

export interface InternEvaluationItem {
  id: string; // placementId
  offer: {
    title: string;
  };
  student: {
    id: string;
    specialization: string;
    studyYear: number;
    group: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  evaluation?: {
    id: string;
    grade: number | null;
    feedback: string | null;
    competenciesAcquired: string[];
    evaluatorName: string;
    submittedAt: Date | string;
  } | null;
}

interface FinalEvaluationFormProps {
  interns: InternEvaluationItem[];
  defaultEvaluatorName?: string;
}

export function FinalEvaluationForm({
  interns = [],
  defaultEvaluatorName = "",
}: FinalEvaluationFormProps) {
  const [selectedPlacementId, setSelectedPlacementId] = useState<string>(
    interns[0]?.id || ""
  );
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedIntern = interns.find((i) => i.id === selectedPlacementId) || interns[0];

  // Stare formular
  const [evaluatorName, setEvaluatorName] = useState<string>(defaultEvaluatorName);
  const [grade, setGrade] = useState<number>(10);
  const [feedback, setFeedback] = useState<string>("");
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [newCompetencyInput, setNewCompetencyInput] = useState<string>("");

  // Sincronizare la schimbarea internului
  useEffect(() => {
    if (selectedIntern) {
      if (selectedIntern.evaluation) {
        setEvaluatorName(selectedIntern.evaluation.evaluatorName || defaultEvaluatorName);
        setGrade(Number(selectedIntern.evaluation.grade) || 10);
        setFeedback(selectedIntern.evaluation.feedback || "");
        setCompetencies(selectedIntern.evaluation.competenciesAcquired || []);
      } else {
        setEvaluatorName(defaultEvaluatorName);
        setGrade(10);
        setFeedback("");
        setCompetencies(["Dezvoltare software", "Lucru în echipă", "Rezolvare probleme"]);
      }
      setMsg(null);
    }
  }, [selectedPlacementId, selectedIntern, defaultEvaluatorName]);

  const handleAddCompetency = () => {
    const val = newCompetencyInput.trim();
    if (val && !competencies.includes(val)) {
      setCompetencies([...competencies, val]);
      setNewCompetencyInput("");
    }
  };

  const handleRemoveCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!selectedIntern) return;

    if (!evaluatorName.trim()) {
      setMsg({ type: "error", text: "Numele evaluatorului este obligatoriu." });
      return;
    }

    if (grade < 1 || grade > 10) {
      setMsg({ type: "error", text: "Nota acordată trebuie să fie între 1.0 și 10.0." });
      return;
    }

    if (feedback.trim().length < 5) {
      setMsg({ type: "error", text: "Aprecierea stagiului trebuie să aibă minim 5 caractere." });
      return;
    }

    startTransition(async () => {
      try {
        await submitFinalEvaluation({
          placementId: selectedIntern.id,
          grade: Number(grade),
          feedback: feedback.trim(),
          competenciesAcquired: competencies,
          evaluatorName: evaluatorName.trim(),
        });
        setMsg({
          type: "success",
          text: `Fișa de evaluare finală pentru ${selectedIntern.student.user.firstName} ${selectedIntern.student.user.lastName} a fost salvată cu succes!`,
        });
      } catch (err: any) {
        setMsg({ type: "error", text: err.message || "Eroare la salvarea evaluării finale." });
      }
    });
  };

  if (!interns || interns.length === 0) {
    return (
      <div className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 p-8 text-center text-slate-400">
        <Award className="w-10 h-10 mx-auto text-sky-400/60 mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Niciun stagiu de evaluat</h3>
        <p className="text-xs max-w-md mx-auto">
          Nu există practicanți cu plasament confirmat alocați ofertelor companiei dumneavoastră. Formularul de evaluare devine activ odată ce stagiile sunt confirmate.
        </p>
      </div>
    );
  }

  const isAlreadyEvaluated = !!selectedIntern?.evaluation;

  return (
    <div className="space-y-6">
      {/* 1. Selector Practicant */}
      <div className="bg-[#0B1221]/88 backdrop-blur-xl p-6 rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Selectează Practicantul de Evaluat
          </label>
          <select
            value={selectedIntern?.id}
            onChange={(e) => setSelectedPlacementId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 text-sm font-bold text-white bg-[#070D19] border border-sky-500/30 rounded-xl focus:outline-none focus:border-sky-400"
          >
            {interns.map((i) => (
              <option key={i.id} value={i.id}>
                {i.student.user.firstName} {i.student.user.lastName} — {i.offer.title} {i.evaluation ? "✓ (Evaluat)" : "(Necompletat)"}
              </option>
            ))}
          </select>
        </div>

        <div>
          {isAlreadyEvaluated ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Notă Înregistrată: {Number(selectedIntern.evaluation?.grade).toFixed(1)} / 10
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/15 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold">
              <FileCheck className="w-4 h-4 text-amber-400" />
              Evaluare în așteptare
            </span>
          )}
        </div>
      </div>

      {/* 2. Mesaj de Notificare Status */}
      {msg && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 ${
            msg.type === "success"
              ? "bg-emerald-950/50 border-emerald-500/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "bg-rose-950/50 border-rose-500/40 text-rose-300"
          }`}
        >
          {msg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 3. Formular Fișă de Evaluare Finală */}
      <form
        onSubmit={handleSubmit}
        className="bg-[#0B1221]/88 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 md:p-8 space-y-6"
      >
        <div className="flex items-center gap-2 pb-4 border-b border-sky-500/15">
          <Award className="w-5 h-5 text-sky-400" />
          <div>
            <h3 className="text-base font-bold text-white">
              Fișă de Evaluare Finală a Stagiului de Practică
            </h3>
            <p className="text-xs text-slate-400">
              Student: <strong className="text-white">{selectedIntern.student.user.firstName} {selectedIntern.student.user.lastName}</strong> ({selectedIntern.student.specialization}, Grupa {selectedIntern.student.group})
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nume Evaluator */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Nume Tutore / Evaluator din Companie
            </label>
            <input
              type="text"
              required
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              placeholder="Ex: Ing. Radu Mihăilescu"
              className="w-full px-3.5 py-2.5 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          {/* Notă Finală */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300">
              Notă Finală Acordată (1.0 - 10.0)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                max={10}
                step={0.5}
                required
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="w-32 px-3.5 py-2.5 bg-[#070D19] border border-sky-500/30 rounded-xl text-sm font-black text-emerald-400 focus:outline-none focus:border-sky-400"
              />
              <span className="text-xs text-slate-400">
                (va fi consemnată oficial în adeverința de practică)
              </span>
            </div>
          </div>
        </div>

        {/* Competențe Dobândite */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-300">
            Competențe Dobândite de Student în Cadrul Stagiului
          </label>
          <div className="flex flex-wrap gap-2 pb-2">
            {competencies.map((comp, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-950/80 border border-sky-500/30 text-sky-300 text-xs font-medium shadow-xs"
              >
                {comp}
                <button
                  type="button"
                  onClick={() => handleRemoveCompetency(idx)}
                  className="hover:text-rose-400 ml-1 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newCompetencyInput}
              onChange={(e) => setNewCompetencyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCompetency();
                }
              }}
              placeholder="Adaugă competență (ex: Docker, Testare automate, React)..."
              className="flex-1 px-3.5 py-2 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            <button
              type="button"
              onClick={handleAddCompetency}
              className="px-3.5 py-2 bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-sky-300 rounded-xl text-xs font-bold transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adaugă</span>
            </button>
          </div>
        </div>

        {/* Apreciere Tutore / Feedback */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-300">
            Aprecierea Detaliată a Tutorelui & Recomandări
          </label>
          <textarea
            required
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Descrieți conduita studentului, implicarea în proiect, abilitățile demonstrate și potențialul de integrare în echipă..."
            className="w-full px-3.5 py-2.5 bg-[#070D19] border border-sky-500/30 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 resize-none leading-relaxed"
          />
        </div>

        {/* Buton Salvare */}
        <div className="pt-2 flex items-center justify-between flex-wrap gap-4">
          <p className="text-[11px] text-slate-400">
            * Completarea fișei de evaluare va notifica automat studentul și coordonatorul universitar.
          </p>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-sky-500 hover:from-emerald-400 hover:to-sky-400 text-slate-950 font-black rounded-xl text-xs shadow-[0_0_20px_rgba(16,185,129,0.3)] transition disabled:opacity-50"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{isAlreadyEvaluated ? "Actualizează Evaluarea Finală" : "Trimite Evaluarea Finală"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
