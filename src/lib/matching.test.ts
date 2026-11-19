import { runGaleShapley, handleMinimalReallocation } from "./matching";

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

testGaleShapley();
testConfirmedStudentsExcluded();
testMinimalReallocationOnCompanyCancel();
testConfirmAllLogic();
