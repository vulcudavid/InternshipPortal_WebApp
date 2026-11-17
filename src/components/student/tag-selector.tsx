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
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    bgClass: "text-amber-700 bg-amber-50",
  },
  INTERMEDIATE: {
    label: "Mediu",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    bgClass: "text-blue-700 bg-blue-50",
  },
  ADVANCED: {
    label: "Avansat",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgClass: "text-emerald-700 bg-emerald-50",
  },
};

export function TagSelector({ availableTags, currentSkills }: TagSelectorProps) {
  const [isPending, startTransition] = useTransition();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Competențele selectate de student
  const [skills, setSkills] = useState<SkillPayload[]>(
    currentSkills.map((s) => ({
      tagId: s.tagId,
      name: s.tagName,
      domain: s.domain,
      proficiency: s.proficiency,
    }))
  );

  // Filtrare și căutare
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState<string>("ALL");
  const [customTagName, setCustomTagName] = useState("");
  const [customTagDomain, setCustomTagDomain] = useState<EngineeringDomain>("COMPUTER_SCIENCE_IT");

  // Verificare dacă un tag este deja selectat
  const isTagSelected = (name: string) => {
    return skills.some((s) => s.name.toLowerCase() === name.toLowerCase());
  };

  // Adăugare tag din catalog
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

  // Eliminare tag
  const handleRemoveSkill = (tagName: string) => {
    setSkills(skills.filter((s) => s.name.toLowerCase() !== tagName.toLowerCase()));
  };

  // Modificare nivel de competență
  const handleProficiencyChange = (tagName: string, newLevel: ProficiencyLevel) => {
    setSkills(
      skills.map((s) =>
        s.name.toLowerCase() === tagName.toLowerCase() ? { ...s, proficiency: newLevel } : s
      )
    );
  };

  // Adăugare tag custom
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

  // Salvare în baza de date
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

  // Filtrare tag-uri disponibile
  const filteredCatalog = availableTags.filter((tag) => {
    const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDomain =
      selectedDomainFilter === "ALL" || tag.domain === selectedDomainFilter;
    return matchesSearch && matchesDomain;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
      {/* Antet Secțiune */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600" />
            Competențe & Nomenclator ULBS (41 Tag-uri)
          </h3>
          <p className="text-xs text-slate-500">
            Alege tehnologiile și competențele pe care le stăpânești pentru a calcula scorul de potrivire cu ofertele.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg">
            {skills.length} competențe selectate
          </span>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-sm"
          >
            {isPending ? (
              <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            Salvează Competențele
          </button>
        </div>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 1. Competențele Curente ale Studentului cu Nivel */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Competențele tale active & Nivel de stăpânire
        </h4>

        {skills.length === 0 ? (
          <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 text-xs text-slate-500">
            Nu ai adăugat încă nicio competență. Selectează din catalogul de mai jos sau adaugă un tag custom.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {skills.map((skill) => {
              const currentProf = PROFICIENCY_CONFIG[skill.proficiency];
              return (
                <div
                  key={skill.name}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-semibold text-slate-900 text-xs truncate">
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
                      className="p-1 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
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

      {/* 2. Catalogul Oficial ULBS (Filtrare & Căutare) */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Catalog Oficial Facultatea de Inginerie ULBS
          </h4>

          {/* Căutare */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Caută în cele 41 de tag-uri..."
              className="w-full text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white pl-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
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
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
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
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 opacity-60 cursor-default"
                    : "bg-white border-slate-200 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-900 shadow-2xs"
                }`}
              >
                {alreadyAdded ? (
                  <Check className="w-3.5 h-3.5 text-indigo-600" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{tag.name}</span>
              </button>
            );
          })}
          {filteredCatalog.length === 0 && (
            <p className="text-xs text-slate-500 py-2">
              Niciun tag nu corespunde căutării „{searchTerm}”. Poți adăuga un tag custom mai jos.
            </p>
          )}
        </div>
      </div>

      {/* 3. Adăugare Tag Personalizat (Custom Tag) */}
      <form
        onSubmit={handleAddCustomTag}
        className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-3"
      >
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-indigo-600" />
            Adaugă o competență personalizată (Custom Tag)
          </label>
          <span className="text-[11px] text-slate-500">
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
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={customTagDomain}
              onChange={(e) => setCustomTagDomain(e.target.value as EngineeringDomain)}
              className="text-xs px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
            >
              {Object.entries(DOMAIN_LABELS).map(([domainKey, label]) => (
                <option key={domainKey} value={domainKey}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition shrink-0"
            >
              Adaugă
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
