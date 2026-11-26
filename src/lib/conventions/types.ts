export interface ConventionData {
  conventionNumber: string;
  dateStr?: string;
  // Universitate
  facultyName: string;
  universityName: string;
  universityAddress: string;
  decanName: string;
  supervisorName: string;
  supervisorRole?: string;
  supervisorPhone: string;
  supervisorEmail: string;
  // Partener / Companie
  companyName: string;
  companyAddress: string;
  companyCity: string;
  regCom?: string;
  cuiCif: string;
  bankAccount?: string;
  bankName?: string;
  legalRepresentative: string;
  contactPhone?: string;
  // Tutore
  tutorName: string;
  tutorRole?: string;
  tutorPhone?: string;
  tutorEmail: string;
  // Student
  studentName: string;
  specialization: string;
  studyYear: number;
  group: string;
  studentPhone?: string;
  studentEmail?: string;
  // Stagiu & Durată
  periodStart: string;
  periodEnd: string;
  totalHours: number;
  dailyHours: number;
  workSchedule: string;
  locationAddress: string;
  offerTitle: string;
  creditsCount: number;
}
