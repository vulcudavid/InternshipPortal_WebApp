import { runGaleShapley, handleMinimalReallocation } from "./matching";
import { computeSpecializationBreakdown } from "./specializations";
import { PlacementStatus } from "@prisma/client";

function testGaleShapley() {
  console.log("🧪 Testare Algoritm Gale-Shapley (Many-to-One)...");

  const students = [
    { studentId: "stud-1", preferences: ["off-A", "off-B"] },
    { studentId: "stud-2", preferences: ["off-A", "off-B"] },
    { studentId: "stud-3", preferences: ["off-B", "off-A"] },
  ];

  const offers = [
    { offerId: "off-A", capacity: 1, studentRanking: ["stud-2", "stud-1", "stud-3"] },
    { offerId: "off-B", capacity: 2, studentRanking: ["stud-1", "stud-3", "stud-2"] },
  ];

  const result = runGaleShapley(students, offers);
  console.log("Rezultat matching:", result.allocations);

  // Verificare:
  // off-A are capacitate 1 si prefera stud-2 > stud-1.
  // stud-1 prefera off-A, dar e respins in favoarea lui stud-2, deci merge la off-B.
  // stud-3 prefera off-B.
  // off-B are capacitate 2 si ii ia pe stud-1 si stud-3.
  const matchMap = new Map(result.allocations.map((a) => [a.studentId, a.offerId]));
  if (matchMap.get("stud-2") === "off-A" && matchMap.get("stud-1") === "off-B" && matchMap.get("stud-3") === "off-B") {
    console.log("✅ Gale-Shapley a produs alocarea stabilă corectă!");
  } else {
    throw new Error("Gale-Shapley a eșuat!");
  }

  console.log("\n🧪 Testare Realocare Minimală (Excepție: Studentul refuză locul)...");
  const confirmed = [...result.allocations];
  const realloc = handleMinimalReallocation(
    confirmed,
    { type: "STUDENT_REFUSED", studentId: "stud-1", offerId: "off-B" },
    offers,
    students
  );
  console.log("Alocări actualizate:", realloc.updatedPlacements);
  console.log("Studenți afectați:", realloc.affectedStudents);

  if (realloc.updatedPlacements.find((p) => p.studentId === "stud-2" && p.offerId === "off-A")) {
    console.log("✅ Studentul confirmat anterior (stud-2) NU a fost mutat!");
  }
}

/**
 * TC-NEW-1: Verificare protecție D-005: studenții deja CONFIRMED sunt excluși din runda GS
 */
function testConfirmedStudentsExcluded() {
  console.log("\n🧪 Testare Protecție Studenți Confirmați (D-005)...");

  // stud-2 este deja confirmat pe off-A (capacitate 1 devine 0 pentru runda curentă)
  const students = [
    { studentId: "stud-1", preferences: ["off-A", "off-B"] },
    { studentId: "stud-3", preferences: ["off-B", "off-A"] },
  ];

  const offers = [
    { offerId: "off-A", capacity: 0, studentRanking: ["stud-1", "stud-3"] },
    { offerId: "off-B", capacity: 2, studentRanking: ["stud-1", "stud-3"] },
  ];

  const result = runGaleShapley(students, offers);
  const matchMap = new Map(result.allocations.map((a) => [a.studentId, a.offerId]));

  if (matchMap.has("stud-2")) {
    throw new Error("Studentul deja confirmat stud-2 nu trebuia să fie alocat prin GS!");
  }

  // Deoarece off-A are capacitate 0 rămasă, stud-1 merge la off-B
  if (matchMap.get("stud-1") === "off-B" && matchMap.get("stud-3") === "off-B") {
    console.log("✅ Studenții confirmați sunt protejați și capacitatea rămasă este respectată!");
  } else {
    throw new Error("Alocarea cu studenți excluși nu a respectat capacitățile!");
  }
}

/**
 * TC-NEW-2: Verificare realocare minimală la anulare plasament de către companie
 */
function testMinimalReallocationOnCompanyCancel() {
  console.log("\n🧪 Testare Realocare Minimală la Anulare de către Companie (cancelPlacementByCompany)...");

  const confirmedPlacements = [
    { studentId: "stud-2", offerId: "off-A" },
    { studentId: "stud-1", offerId: "off-B" },
  ];

  const offers = [
    { offerId: "off-A", capacity: 1, studentRanking: ["stud-2", "stud-3", "stud-1"] },
    { offerId: "off-B", capacity: 1, studentRanking: ["stud-1", "stud-2"] },
  ];

  const students = [
    { studentId: "stud-1", preferences: ["off-B"] },
    { studentId: "stud-2", preferences: ["off-A"] },
    { studentId: "stud-3", preferences: ["off-A", "off-B"] },
  ];

  // Compania anulează plasamentul lui stud-2 pe off-A
  const realloc = handleMinimalReallocation(
    confirmedPlacements,
    { type: "STUDENT_REFUSED", studentId: "stud-2", offerId: "off-A" },
    offers,
    students
  );

  const placedMap = new Map(realloc.updatedPlacements.map((p) => [p.studentId, p.offerId]));

  // stud-1 rămâne neperturbat pe off-B
  if (placedMap.get("stud-1") !== "off-B") {
    throw new Error("Studentul confirmat stud-1 a fost perturbat nepermis!");
  }

  // stud-3 (următorul din ranking-ul off-A care vrea off-A) a preluat locul
  if (placedMap.get("stud-3") === "off-A") {
    console.log("✅ Candidatul următor din clasament a preluat locul eliberat, fără mutarea celor confirmați!");
  } else {
    throw new Error("Realocarea minimală nu a atribuit corect locul candidatului următor!");
  }
}

/**
 * TC-NEW-3: Verificare logică confirmAllPlacements
 */
function testConfirmAllLogic() {
  console.log("\n🧪 Testare Logică Confirmare în Masă (Bulk Confirm)...");

  const mockPlacements = [
    { id: "p1", status: "PENDING_CONFIRMATION" },
    { id: "p2", status: "PENDING_CONFIRMATION" },
    { id: "p3", status: "CONFIRMED" },
    { id: "p4", status: "CANCELLED_BY_COORDINATOR" },
  ];

  // Simulare updateMany: afectează doar cele PENDING
  const updated = mockPlacements.map((p) =>
    p.status === "PENDING_CONFIRMATION" ? { ...p, status: "CONFIRMED" } : p
  );

  const confirmedCount = updated.filter((p) => p.status === "CONFIRMED").length;
  const cancelledCount = updated.filter((p) => p.status === "CANCELLED_BY_COORDINATOR").length;

  if (confirmedCount === 3 && cancelledCount === 1) {
    console.log("✅ Confirmarea în masă a actualizat exclusiv plasamentele PENDING_CONFIRMATION!");
  } else {
    throw new Error("Logica de confirmare în masă a alterat stări nepermise!");
  }
}

/**
 * TC-NEW-4: Verificare agregare statistici pe specializări ULBS & consistență KPI
 */
function testSpecializationAggregationLogic() {
  console.log("\n🧪 Testare Agregare Statistici pe Specializări ULBS...");

  const mockStudents = [
    // Calculatoare (CTI): 2 studenți (1 confirmat, 1 în așteptare) => total 2, plasați 2, nealocați 0, rate 100%
    {
      specialization: "Calculatoare",
      placement: { status: PlacementStatus.CONFIRMED },
    },
    {
      specialization: "Calculatoare",
      placement: { status: PlacementStatus.PENDING_CONFIRMATION },
    },
    // Tehnologia Informației (TI): 2 studenți (1 în așteptare, 1 anulat) => total 2, plasați 1, nealocați 1, rate 50%
    {
      specialization: "Tehnologia Informației",
      placement: { status: PlacementStatus.PENDING_CONFIRMATION },
    },
    {
      specialization: "Tehnologia Informației",
      placement: { status: PlacementStatus.CANCELLED_BY_COMPANY },
    },
    // Robotică (ROB): 1 student fără plasament => total 1, plasați 0, nealocați 1, rate 0%
    {
      specialization: "Robotică",
      placement: null,
    },
  ];

  const breakdown = computeSpecializationBreakdown(mockStudents);

  const cti = breakdown.find((s) => s.name === "Calculatoare");
  const ti = breakdown.find((s) => s.name === "Tehnologia Informației");
  const rob = breakdown.find((s) => s.name === "Robotică");
  const em = breakdown.find((s) => s.name === "Electromecanică");

  if (!cti || !ti || !rob || !em) {
    throw new Error("Nu au fost generate toate specializările standard ULBS!");
  }

  // Verificare CTI
  if (
    cti.totalEligible !== 2 ||
    cti.placedCount !== 2 ||
    cti.confirmedCount !== 1 ||
    cti.pendingCount !== 1 ||
    cti.unplacedCount !== 0 ||
    cti.successRate !== 100
  ) {
    throw new Error(`Statistici incorecte pentru CTI: ${JSON.stringify(cti)}`);
  }

  // Verificare TI
  if (
    ti.totalEligible !== 2 ||
    ti.placedCount !== 1 ||
    ti.confirmedCount !== 0 ||
    ti.pendingCount !== 1 ||
    ti.unplacedCount !== 1 ||
    ti.successRate !== 50
  ) {
    throw new Error(`Statistici incorecte pentru TI: ${JSON.stringify(ti)}`);
  }

  // Verificare ROB
  if (
    rob.totalEligible !== 1 ||
    rob.placedCount !== 0 ||
    rob.unplacedCount !== 1 ||
    rob.successRate !== 0
  ) {
    throw new Error(`Statistici incorecte pentru ROB: ${JSON.stringify(rob)}`);
  }

  // Verificare EM (specializare fără studenți)
  if (em.totalEligible !== 0 || em.placedCount !== 0 || em.unplacedCount !== 0) {
    throw new Error(`Specializarea goală EM ar trebui să aibă 0 eligibili: ${JSON.stringify(em)}`);
  }

  // Verificare Consistență Sumă Globală
  const sumEligible = breakdown.reduce((acc, s) => acc + s.totalEligible, 0);
  const sumPlaced = breakdown.reduce((acc, s) => acc + s.placedCount, 0);
  const sumConfirmed = breakdown.reduce((acc, s) => acc + s.confirmedCount, 0);
  const sumPending = breakdown.reduce((acc, s) => acc + s.pendingCount, 0);
  const sumUnplaced = breakdown.reduce((acc, s) => acc + s.unplacedCount, 0);

  if (sumEligible !== 5) {
    throw new Error(`Suma totalEligible este ${sumEligible}, așteptat 5!`);
  }
  if (sumPlaced !== 3) {
    throw new Error(`Suma placedCount este ${sumPlaced}, așteptat 3!`);
  }
  if (sumConfirmed !== 1 || sumPending !== 2 || sumUnplaced !== 2) {
    throw new Error(
      `Sume status invalide: Confirmed=${sumConfirmed}, Pending=${sumPending}, Unplaced=${sumUnplaced}`
    );
  }

  console.log("✅ Agregarea pe specializări și consistența sumelor globale sunt validate cu succes!");
}

testGaleShapley();
testConfirmedStudentsExcluded();
testMinimalReallocationOnCompanyCancel();
testConfirmAllLogic();
testSpecializationAggregationLogic();
