"use client";

import { useState, useTransition } from "react";
import { EngineeringDomain, ProficiencyLevel } from "@prisma/client";
import { DOMAIN_LABELS } from "@/lib/tags";
import { updateStudentSkills, SkillPayload } from "@/app/actions/student";
import { 
  Code2, 
  Search, 
  Plus, 
  X, 
  Check, 
  Save, 
  CheckCircle2, 
  AlertCircle,
  Layers,
  Sparkles
} from "lucide-react";

interface TagItem {
  id: string;
  name: string;
  domain: EngineeringDomain;
  isPredefined: boolean;
}

interface StudentSkillItem {
  tagId: string;
  tagName: string;
  domain: EngineeringDomain;
  proficiency: ProficiencyLevel;
}

interface TagSelectorProps {
  availableTags: TagItem[];
  currentSkills: StudentSkillItem[];
}

const PROFICIENCY_CONFIG: Record<
  ProficiencyLevel, 
  { label: string; badgeClass: string; bgClass: string }
> = {
  BEGINNER: {
    label: "Începător",
    badgeClass: "bg-slate-800 text-slate-300 border-slate-700",
    bgClass: "text-slate-300 bg-slate-900/60",
  },
  INTERMEDIATE: {
    label: "Mediu",
    badgeClass: "bg-sky-950 text-sky-300 border-sky-500/40 shadow-[0_0_10px_rgba(14,165,233,0.15)]",
    bgClass: "text-sky-300 bg-sky-950/60",
  },
  ADVANCED: {
    label: "Avansat",
    badgeClass: "bg-emerald-950 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
    bgClass: "text-emerald-300 bg-emerald-950/60",
  },
};

export function TagSelector({ availableTags, currentSkills }: TagSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [skills, setSkills] = useState<SkillPayload[]>(
    currentSkills.map((s) => ({
      tagId: s.tagId,
      name: s.tagName,
      domain: s.domain,
      proficiency: s.proficiency,
    }))
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("ALL");
  const [customTagName, setCustomTagName] = useState("");
  const [customTagDomain, setCustomTagDomain] = useState<EngineeringDomain>("COMPUTER_SCIENCE_IT");

  const isTagSelected = (name: string) => {
    return skills.some((s) => s.name.toLowerCase() === name.toLowerCase());
  };

  const handleAddTag = (tag: TagItem) => {
    if (isTagSelected(tag.name)) return;
    setSkills([
      ...skills,
      {
        tagId: tag.id,
        name: tag.name,
        domain: tag.domain,
        proficiency: "INTERMEDIATE",
      },
    ]);
  };

  const handleRemoveSkill = (tagName: string) => {
    setSkills(skills.filter((s) => s.name.toLowerCase() !== tagName.toLowerCase()));
  };

  const handleProficiencyChange = (tagName: string, newLevel: ProficiencyLevel) => {
    setSkills(
      skills.map((s) =>
        s.name.toLowerCase() === tagName.toLowerCase() ? { ...s, proficiency: newLevel } : s
      )
    );
  };

  const handleAddCustomTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customTagName.trim();
    if (!trimmed) return;
    if (isTagSelected(trimmed)) {
      setErrorMessage(`Competența "${trimmed}" este deja adăugată.`);
      return;
    }

    setSkills([
      ...skills,
      {
        name: trimmed,
        domain: customTagDomain,
        proficiency: "INTERMEDIATE",
        isCustom: true,
      },
    ]);
    setCustomTagName("");
    setErrorMessage(null);
  };

  const handleSave = () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    startTransition(async () => {
      try {
        const result = await updateStudentSkills(skills);
        if (result?.success) {
          setSuccessMessage(`Au fost salvate cu succes ${result.count} competențe!`);
          setTimeout(() => setSuccessMessage(null), 4000);
        }
      } catch (err: unknown) {
        const error = err as Error;
        setErrorMessage(error.message || "A apărut o eroare la salvarea competențelor.");
      }
    });
  };

  const filteredCatalog = availableTags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain =
      selectedDomainFilter === "ALL" || tag.domain === selectedDomainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="bg-[#0B1221]/80 backdrop-blur-xl rounded-2xl border border-sky-400/20 shadow-[0_0_25px_rgba(14,165,233,0.06)] p-6 space-y-6">
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-500/15 pb-4">
        <div>
          <h3 className="font-bold text-white text-lg flex items-center gap-2">
            <Code2 className="w-5 h-5 text-sky-400" />
            Competențe & Nomenclator ULBS (41 Tag-uri)
          </h3>
          <p className="text-xs text-slate-400">
            Alege tehnologiile și competențele pe care le stăpânești pentru a calcula scorul de potrivire cu ofertele.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-sky-950/60 text-sky-300 border border-sky-500/30 rounded-lg">
            {skills.length} competențe selectate
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition flex items-center gap-1.5 shadow-[0_0_20px_rgba(14,165,233,0.35)]"
          >
            {isPending ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvează Competențele
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/40 text-rose-200 rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.15)] animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Competențele Curente ale Studentului cu Nivel */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          Competențele tale active & Nivel de stăpânire
        </h4>

        {skills.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-sky-500/20 rounded-xl bg-[#070D19]/60 text-xs text-slate-400">
            Nu ai adăugat încă nicio competență. Selectează din catalogul de mai jos sau adaugă un tag custom.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {skills.map((skill) => {
              const currentProf = PROFICIENCY_CONFIG[skill.proficiency];
              return (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-sky-500/20 bg-[#070D19]/80 hover:border-sky-400/40 transition shadow-inner"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-white text-xs truncate">
                      {skill.name}
                    </p>
                    <span className="text-[10px] text-slate-400 block truncate">
                      {DOMAIN_LABELS[skill.domain || "COMPUTER_SCIENCE_IT"]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <select
                      value={skill.proficiency}
                      onChange={(e) =>
                        handleProficiencyChange(skill.name, e.target.value as ProficiencyLevel)
                      }
                      className={`text-[11px] font-bold px-2 py-1 rounded-md border focus:outline-none cursor-pointer ${currentProf.badgeClass}`}
                    >
                      <option value="BEGINNER">Începător</option>
                      <option value="INTERMEDIATE">Mediu</option>
                      <option value="ADVANCED">Avansat</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill.name)}
                      className="p-1 text-slate-400 hover:text-rose-400 rounded-md hover:bg-rose-950/40 transition"
                      title="Elimină competența"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Catalogul Oficial ULBS */}
      <div className="p-4 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            Catalog Oficial Facultatea de Inginerie ULBS
          </h4>

          {/* Căutare */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută în cele 41 de tag-uri..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white pl-8 placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
        </div>

        {/* Filtre după Domenii */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedDomainFilter("ALL")}
            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
              selectedDomainFilter === "ALL"
                ? "bg-sky-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                : "bg-[#0B1221] text-slate-400 border border-sky-500/20 hover:border-sky-400/40 hover:text-white"
            }`}
          >
            Toate (41)
          </button>
          {Object.entries(DOMAIN_LABELS).map(([domainKey, label]) => (
            <button
              key={domainKey}
              type="button"
              onClick={() => setSelectedDomainFilter(domainKey)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                selectedDomainFilter === domainKey
                  ? "bg-sky-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(14,165,233,0.3)]"
                  : "bg-[#0B1221] text-slate-400 border border-sky-500/20 hover:border-sky-400/40 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Lista Tag-urilor din Catalog */}
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto p-1">
          {filteredCatalog.map((tag) => {
            const alreadyAdded = isTagSelected(tag.name);
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                disabled={alreadyAdded}
                className={`text-xs px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition ${
                  alreadyAdded
                    ? "bg-sky-950/40 border-sky-500/30 text-sky-400 opacity-50 cursor-default"
                    : "bg-[#0B1221] border-sky-500/20 text-slate-300 hover:border-sky-400 hover:text-white hover:bg-sky-500/10 shadow-inner"
                }`}
              >
                {alreadyAdded ? (
                  <Check className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-sky-400" />
                )}
                <span>{tag.name}</span>
              </button>
            );
          })}
          {filteredCatalog.length === 0 && (
            <p className="text-xs text-slate-400 py-2">
              Niciun tag nu corespunde căutării „{searchTerm}”. Poți adăuga un tag custom mai jos.
            </p>
          )}
        </div>
      </div>

      {/* 3. Adăugare Tag Personalizat */}
      <form
        onSubmit={handleAddCustomTag}
        className="p-4 bg-[#070D19]/70 border border-sky-500/20 rounded-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            Adaugă o competență personalizată (Custom Tag)
          </label>
          <span className="text-[11px] text-slate-400">
            Dacă tehnologia ta nu este în cele 41 de tag-uri oficiale
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={customTagName}
              onChange={(e) => setCustomTagName(e.target.value)}
              placeholder="Ex: GraphQL, Flutter, Rust, SolidWorks PDM..."
              className="w-full text-xs px-3 py-2 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={customTagDomain}
              onChange={(e) => setCustomTagDomain(e.target.value as EngineeringDomain)}
              className="text-xs px-2.5 py-2 rounded-lg border border-sky-500/30 bg-[#0B1221] text-white focus:outline-none focus:border-sky-400 w-full"
            >
              {Object.entries(DOMAIN_LABELS).map(([domainKey, label]) => (
                <option key={domainKey} value={domainKey}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg transition shrink-0 shadow-[0_0_15px_rgba(14,165,233,0.3)]"
            >
              Adaugă
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
