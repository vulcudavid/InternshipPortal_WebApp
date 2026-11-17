import { EngineeringDomain } from "@prisma/client";

export interface ULBSSpecializationDef {
  name: string;
  domain: EngineeringDomain;
  abbreviation?: string;
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
