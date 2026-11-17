"use client";

import { useState, useTransition } from "react";
import { 
  rankApplicant, 
  reorderCompanyApplicantRanks, 
  removeCompanyApplicantRank 
} from "@/app/actions/company";
import { calculateCompatibilityScore, StudentSkillInput, OfferTagInput } from "@/lib/scoring";
import { EngineeringDomain, ProficiencyLevel } from "@prisma/client";
import { 
  Users, 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  ChevronUp, 
  ChevronDown, 
  X, 
  Plus, 
  Loader2, 
  Phone, 
  Mail, 
  ExternalLink,
  GraduationCap,
  Award,
  AlertCircle,
  Lock
} from "lucide-react";

interface StudentTagData {
  proficiency: ProficiencyLevel;
  tag: {
    id: string;
    name: string;
    domain: EngineeringDomain;
  };
}

export interface StudentData {
  id: string;
  specialization: string;
  studyYear: number;
  group: string;
  domain: EngineeringDomain;
  headline?: string | null;
  bio?: string | null;
  phone?: string | null;
  cvUrl?: string | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  tags: StudentTagData[];
}

interface OfferTagData {
  tagId: string;
  isRequired: boolean;
  weight: number;
  tag: {
    id: string;
    name: string;
    domain: EngineeringDomain;
  };
}

interface ApplicantRankData {
  id: string;
  offerId: string;
  studentId: string;
  rank: number;
  feedback?: string | null;
  student: StudentData;
}

interface OfferWithApplicants {
  id: string;
  title: string;
  primaryDomain: EngineeringDomain;
  slotsTotal: number;
  slotsAvailable: number;
  offerTags: OfferTagData[];
  preferences: {
    studentId: string;
    rank: number;
    student: StudentData;
  }[];
  applicantRanks: ApplicantRankData[];
}

interface ApplicantsManagerProps {
  offers: OfferWithApplicants[];
  allStudents: StudentData[]; // Feed recomandări
  companyId: string;
}

export function ApplicantsManager({ offers, allStudents, companyId }: ApplicantsManagerProps) {
  const [selectedOfferId, setSelectedOfferId] = useState<string>(offers[0]?.id || "");
  const [activeTab, setActiveTab] = useState<"APPLICANTS" | "RECOMMENDED">("APPLICANTS");
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedOffer = offers.find((o) => o.id === selectedOfferId) || offers[0];

  if (!selectedOffer) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <Users className="w-8 h-8 mx-auto text-slate-400 mb-2" />
        <p className="text-sm">Nu există nicio ofertă publicată pentru a vizualiza candidații.</p>
      </div>
    );
  }

  // Convertire tag-uri ofertă pentru scoring
  const offerTagInputs: OfferTagInput[] = selectedOffer.offerTags.map((ot) => ({
    tagId: ot.tagId,
    tagName: ot.tag.name,
    domain: ot.tag.domain,
    isRequired: ot.isRequired,
    weight: ot.weight,
  }));

  // Helper pentru scor
  const getScoreForStudent = (student: StudentData) => {
    const studentSkills: StudentSkillInput[] = student.tags.map((st) => ({
      tagId: st.tag.id,
      tagName: st.tag.name,
      domain: st.tag.domain,
      proficiency: st.proficiency,
    }));

    return calculateCompatibilityScore(
      student.domain,
      studentSkills,
      selectedOffer.primaryDomain,
      offerTagInputs
    );
  };

  // Aplicanții reali (cei care au inclus această ofertă în preferințe)
  const applicantsList = selectedOffer.preferences.map((p) => {
    const score = getScoreForStudent(p.student);
    const existingRank = selectedOffer.applicantRanks.find((r) => r.studentId === p.studentId);
    return {
      student: p.student,
      studentPreferenceRank: p.rank,
      score,
      rankEntry: existingRank || null,
    };
  });

  // Clasament ordonat al companiei pentru Gale-Shapley (sortat după rank crescător)
  const rankedApplicants = [...selectedOffer.applicantRanks].sort((a, b) => a.rank - b.rank);

  // Candidați recomandați (studenți care NU au aplicat încă la această ofertă)
  const applicantStudentIds = new Set(selectedOffer.preferences.map((p) => p.studentId));
  const recommendedStudents = allStudents
    .filter((s) => !applicantStudentIds.has(s.id))
    .map((s) => ({
      student: s,
      score: getScoreForStudent(s),
    }))
    .sort((a, b) => b.score.score - a.score.score);

  // Handlers
  const handleAddToRank = (studentId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await rankApplicant(selectedOffer.id, studentId);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Eroare la adăugarea în clasament.");
      }
    });
  };

  const handleMoveRank = (rankIndex: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? rankIndex - 1 : rankIndex + 1;
    if (targetIndex < 0 || targetIndex >= rankedApplicants.length) return;

    const newOrder = [...rankedApplicants];
    const [moved] = newOrder.splice(rankIndex, 1);
    newOrder.splice(targetIndex, 0, moved);

    const orderedIds = newOrder.map((r) => r.id);

    setErrorMsg(null);
    startTransition(async () => {
      try {
        await reorderCompanyApplicantRanks(selectedOffer.id, orderedIds);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Eroare la reordonare.");
      }
    });
  };

  const handleRemoveRank = (rankId: string) => {
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await removeCompanyApplicantRank(rankId);
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : "Eroare la eliminarea din clasament.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Selector Ofertă & Switcher Tab-uri */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Selectează Oferta de Practică
          </label>
          <select
            value={selectedOffer.id}
            onChange={(e) => setSelectedOfferId(e.target.value)}
            className="w-full md:w-96 px-3 py-2 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {o.title} ({o.preferences.length} aplicanți • {o.slotsTotal} locuri)
              </option>
            ))}
          </select>
        </div>

        {/* Butoane Tab */}
        <div className="flex bg-slate-100 p-1 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab("APPLICANTS")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "APPLICANTS"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Aplicanți & Clasament ({applicantsList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("RECOMMENDED")}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === "RECOMMENDED"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Recomandări Algoritm ({recommendedStudents.length})</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: APLICANȚI & CLASAMENT GALE-SHAPLEY */}
      {activeTab === "APPLICANTS" && (
        <div className="space-y-6">
          {/* Panou Informativ Gale-Shapley */}
          <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-start gap-3">
            <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-blue-900">
              <span className="font-bold">Input Clasament pentru Algoritmul Gale-Shapley (Many-to-One):</span>
              <p className="text-blue-700 leading-relaxed">
                Ierarhizați candidații în ordinea preferinței firmei (Locul 1 = cel mai dorit). Algoritmul de matching va respecta
                capacitatea de <strong>{selectedOffer.slotsTotal} locuri</strong> și preferințele exprimate reciproc de ambele părți.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coloana 1 & 2: Lista Aplicanților cu Scor & Privacy Gate */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-500" />
                Studenți care au aplicat ({applicantsList.length})
              </h3>

              {applicantsList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                  <p className="text-xs text-slate-500">
                    Niciun student nu a inclus încă această ofertă în lista de preferințe.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Puteți explora tab-ul de <strong>Recomandări</strong> pentru a vizualiza profilurile compatibile din facultate.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applicantsList.map(({ student, studentPreferenceRank, score, rankEntry }) => {
                    const isRanked = !!rankEntry;

                    return (
                      <div
                        key={student.id}
                        className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4 hover:border-slate-300 transition"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-slate-900">
                                {student.user.firstName} {student.user.lastName}
                              </h4>
                              <span className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                                {student.specialization} • Anul {student.studyYear}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold">
                                Preferința #{studentPreferenceRank} a studentului
                              </span>
                            </div>

                            {student.headline && (
                              <p className="text-xs text-slate-600 italic">&ldquo;{student.headline}&rdquo;</p>
                            )}
                          </div>

                          {/* Scor Compatibilitate Badge */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                                Scor Potrivire
                              </span>
                              <span
                                className={`text-sm font-black ${
                                  score.score >= 70
                                    ? "text-emerald-600"
                                    : score.score >= 40
                                    ? "text-amber-600"
                                    : "text-slate-500"
                                }`}
                              >
                                {score.score.toFixed(0)}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Breakdown Scor & Tag-uri */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-semibold text-slate-500">Competențe Obligatorii:</span>
                            {score.matchedRequiredTags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold"
                              >
                                ✓ {t}
                              </span>
                            ))}
                            {score.missingRequiredTags.map((t) => (
                              <span
                                key={t}
                                className="px-1.5 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[10px]"
                              >
                                ✗ {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Privacy Gate Verificat: Date de contact & Buton CV */}
                        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50/60 p-3 rounded-xl">
                          <div className="flex items-center gap-4 text-slate-600 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-emerald-600" />
                              <span className="text-[11px] font-semibold text-emerald-700">Privacy Gate: Aplicație Activă</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <span>{student.user.email}</span>
                            </div>
                            {student.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3.5 h-3.5 text-slate-400" />
                                <span>{student.phone}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Buton Descărcare CV */}
                            {student.cvUrl ? (
                              <a
                                href={`/api/cv/${student.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold shadow-2xs transition"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Descarcă CV</span>
                              </a>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Fără CV încărcat</span>
                            )}

                            {/* Buton Ierarhizare */}
                            {isRanked ? (
                              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-bold">
                                Clasat (Locul {rankEntry.rank})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleAddToRank(student.id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition disabled:opacity-50"
                              >
                                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                <span>Adaugă în Clasament</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Coloana 3: Panou Ordonare Clasament Gale-Shapley */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    Clasament Firmă ({rankedApplicants.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ordinea aplicanților stabiliți pentru această poziție (Locul 1 = prima prioritate).
                  </p>
                </div>

                {rankedApplicants.length === 0 ? (
                  <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Niciun candidat adăugat în clasament. Apăsați &ldquo;Adaugă în Clasament&rdquo; pe candidații doriți.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {rankedApplicants.map((r, idx) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {r.rank}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block truncate max-w-[130px]">
                              {r.student.user.firstName} {r.student.user.lastName}
                            </span>
                            <span className="text-[10px] text-slate-500 truncate block">
                              {r.student.specialization}
                            </span>
                          </div>
                        </div>

                        {/* Butoane Reordonare Sus / Jos */}
                        <div className="flex items-center gap-1">
                          <button
                            title="Mută mai sus"
                            disabled={idx === 0 || isPending}
                            onClick={() => handleMoveRank(idx, "UP")}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-slate-200 disabled:opacity-20"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Mută mai jos"
                            disabled={idx === rankedApplicants.length - 1 || isPending}
                            onClick={() => handleMoveRank(idx, "DOWN")}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-slate-200 disabled:opacity-20"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Elimină din clasament"
                            disabled={isPending}
                            onClick={() => handleRemoveRank(r.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-white rounded border border-transparent hover:border-slate-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECOMANDĂRI CANDIDAȚI (FEED TALENTE CU PRIVACY GATE STRICT) */}
      {activeTab === "RECOMMENDED" && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs text-amber-900">
              <span className="font-bold">Regulă de Protecție a Datelor (GDPR Privacy Gate):</span>
              <p className="text-amber-700 leading-relaxed">
                Acești studenți corespund profilului tehnic al ofertei, dar <strong>nu au aplicat încă</strong> la poziția dvs.
                Conform legii și a cerințelor P14, CV-ul complet și datele directe de contact (telefon) sunt strict blocate
                până când studentul își exprimă acordul prin adăugarea ofertei în preferințe.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedStudents.map(({ student, score }) => (
              <div
                key={student.id}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {student.user.firstName} {student.user.lastName}
                    </h4>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {student.specialization} • Anul {student.studyYear}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Potrivire
                    </span>
                    <span
                      className={`text-sm font-black ${
                        score.score >= 70
                          ? "text-emerald-600"
                          : score.score >= 40
                          ? "text-amber-600"
                          : "text-slate-500"
                      }`}
                    >
                      {score.score.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {student.headline && (
                  <p className="text-xs text-slate-600 italic line-clamp-2">&ldquo;{student.headline}&rdquo;</p>
                )}

                {/* Competențe */}
                <div className="flex flex-wrap gap-1">
                  {student.tags.slice(0, 6).map((st) => (
                    <span
                      key={st.tag.id}
                      className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-medium"
                    >
                      {st.tag.name}
                    </span>
                  ))}
                  {student.tags.length > 6 && (
                    <span className="text-[10px] text-slate-400 self-center">
                      +{student.tags.length - 6} altele
                    </span>
                  )}
                </div>

                {/* Privacy Gate Blocat */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl text-slate-500">
                  <div className="flex items-center gap-1.5 text-amber-700 font-medium text-[11px]">
                    <Lock className="w-3.5 h-3.5" />
                    <span>CV & Telefon Protejate GDPR</span>
                  </div>

                  <span className="text-[10px] text-slate-400 italic">
                    Așteaptă aplicația studentului
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
