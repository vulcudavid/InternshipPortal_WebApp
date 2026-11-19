import { EngineeringDomain, PlacementStatus } from "@prisma/client";

export interface ULBSSpecializationDef {
  name: string;
  domain: EngineeringDomain;
  abbreviation?: string;
}

export interface SpecializationStat {
  name: string;
  abbreviation: string;
  domain: EngineeringDomain;
  totalEligible: number;
  placedCount: number; // CONFIRMED + PENDING_CONFIRMATION
  confirmedCount: number;
  pendingCount: number;
  unplacedCount: number;
  successRate: number; // Procentaj rotunjit (placedCount / totalEligible * 100)
}

/**
 * Nume prietenos în limba română pentru domeniul inginereasc
 */
export function formatEngineeringDomain(domain: EngineeringDomain): string {
  switch (domain) {
    case "COMPUTER_SCIENCE_IT":
      return "Calculatoare & IT";
    case "ELECTRONICS_TELECOM":
      return "Electronică & Telecomunicații";
    case "ROBOTICS_MECHATRONICS":
      return "Robotică & Mecatronică";
    case "INDUSTRIAL_MANAGEMENT":
      return "Inginerie Industrială & Management";
    case "GENERAL_ENGINEERING":
      return "Inginerie Generală & Transporturi";
    default:
      return domain;
  }
}

/**
 Programele oficiale de studii de licență din cadrul Facultății de Inginerie (ULBS)
 conform cerințelor de corelare academică
 */
export const ULBS_ENGINEERING_SPECIALIZATIONS: ULBSSpecializationDef[] = [
  { name: "Calculatoare", domain: "COMPUTER_SCIENCE_IT", abbreviation: "CTI" },
  { name: "Tehnologia Informației", domain: "COMPUTER_SCIENCE_IT", abbreviation: "TI" },
  { name: "Ingineria Sistemelor Multimedia", domain: "COMPUTER_SCIENCE_IT", abbreviation: "ISM" },
  { name: "Electronică Aplicată", domain: "ELECTRONICS_TELECOM", abbreviation: "EA" },
  { name: "Rețele și Software de Telecomunicații", domain: "ELECTRONICS_TELECOM", abbreviation: "RST" },
  { name: "Electromecanică", domain: "ROBOTICS_MECHATRONICS", abbreviation: "EM" },
  { name: "Mecatronică", domain: "ROBOTICS_MECHATRONICS", abbreviation: "MTR" },
  { name: "Robotică", domain: "ROBOTICS_MECHATRONICS", abbreviation: "ROB" },
  { name: "Tehnologia Construcțiilor de Mașini", domain: "INDUSTRIAL_MANAGEMENT", abbreviation: "TCM" },
  { name: "Mașini și Sisteme de Producție", domain: "INDUSTRIAL_MANAGEMENT", abbreviation: "MSP" },
  { name: "Inginerie Economică în Domeniul Mecanic", domain: "INDUSTRIAL_MANAGEMENT", abbreviation: "IEDM" },
  { name: "Ingineria și Managementul Calității", domain: "INDUSTRIAL_MANAGEMENT", abbreviation: "IMC" },
  { name: "Ingineria Transporturilor și a Traficului", domain: "GENERAL_ENGINEERING", abbreviation: "ITT" },
];

export const STUDY_YEARS = [
  { value: 1, label: "Anul I (Licență)" },
  { value: 2, label: "Anul II (Licență)" },
  { value: 3, label: "Anul III (Licență)" },
  { value: 4, label: "Anul IV (Licență)" },
];

export function getDomainForSpecialization(specializationName: string): EngineeringDomain {
  const found = ULBS_ENGINEERING_SPECIALIZATIONS.find(
    (s) => s.name.toLowerCase() === specializationName.toLowerCase()
  );
  return found ? found.domain : "COMPUTER_SCIENCE_IT";
}

export interface StudentSpecializationInput {
  specialization: string;
  domain?: EngineeringDomain;
  placement?: { status: PlacementStatus } | null;
}

/**
 * Calculează distribuția statistică a studenților înscriși pe specializările Facultății de Inginerie.
 * Menține consistența cu indicatorii globali ai Gale-Shapley (CONFIRMED, PENDING, UNPLACED).
 */
export function computeSpecializationBreakdown(
  students: StudentSpecializationInput[]
): SpecializationStat[] {
  // 1. Inițializăm harta cu toate cele 13 specializări oficiale ULBS
  const specMap = new Map<string, SpecializationStat>();

  for (const spec of ULBS_ENGINEERING_SPECIALIZATIONS) {
    specMap.set(spec.name, {
      name: spec.name,
      abbreviation: spec.abbreviation || "",
      domain: spec.domain,
      totalEligible: 0,
      placedCount: 0,
      confirmedCount: 0,
      pendingCount: 0,
      unplacedCount: 0,
      successRate: 0,
    });
  }

  // 2. Iterăm peste fiecare student eligibil și agregăm statusul de plasament
  for (const student of students) {
    const rawSpec = (student.specialization || "").trim();
    if (!rawSpec) continue;

    // Căutăm potrivire după nume sau abreviere
    const matched = ULBS_ENGINEERING_SPECIALIZATIONS.find(
      (s) =>
        s.name.toLowerCase() === rawSpec.toLowerCase() ||
        (s.abbreviation && s.abbreviation.toLowerCase() === rawSpec.toLowerCase())
    );

    let stat: SpecializationStat;
    if (matched) {
      stat = specMap.get(matched.name)!;
    } else {
      if (!specMap.has(rawSpec)) {
        specMap.set(rawSpec, {
          name: rawSpec,
          abbreviation: "",
          domain: student.domain || "COMPUTER_SCIENCE_IT",
          totalEligible: 0,
          placedCount: 0,
          confirmedCount: 0,
          pendingCount: 0,
          unplacedCount: 0,
          successRate: 0,
        });
      }
      stat = specMap.get(rawSpec)!;
    }

    stat.totalEligible++;

    const status = student.placement?.status;
    if (status === PlacementStatus.CONFIRMED) {
      stat.confirmedCount++;
      stat.placedCount++;
    } else if (status === PlacementStatus.PENDING_CONFIRMATION) {
      stat.pendingCount++;
      stat.placedCount++;
    } else {
      // Fie nu are plasament, fie este CANCELLED_* sau REFUSED_BY_STUDENT
      stat.unplacedCount++;
    }
  }

  // 3. Calculăm ratele de succes procentuale
  for (const stat of specMap.values()) {
    stat.successRate =
      stat.totalEligible > 0
        ? Math.round((stat.placedCount / stat.totalEligible) * 100)
        : 0;
  }

  return Array.from(specMap.values());
}
