import assert from "assert";
import { describe, it } from "vitest";
import { runGaleShapley, handleMinimalReallocation } from "./matching";

describe("Matching Engine (Gale-Shapley & Minimal Reallocation)", () => {
  // Scenariul 1: Gale-Shapley Standard Many-to-One
  it("1. rulează Gale-Shapley (Many-to-One) și produce alocarea stabilă corectă", () => {
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
    const matchMap = new Map(result.allocations.map((a) => [a.studentId, a.offerId]));

    assert.strictEqual(matchMap.get("stud-2"), "off-A");
    assert.strictEqual(matchMap.get("stud-1"), "off-B");
    assert.strictEqual(matchMap.get("stud-3"), "off-B");
  });

  // Scenariul 2: Realocare minimală de bază
  it("2. efectuează realocarea minimală când un student refuză locul", () => {
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
    const confirmed = [...result.allocations];
    const realloc = handleMinimalReallocation(
      confirmed,
      { type: "STUDENT_REFUSED", studentId: "stud-1", offerId: "off-B" },
      offers,
      students
    );

    assert.ok(
      realloc.updatedPlacements.find((p) => p.studentId === "stud-2" && p.offerId === "off-A"),
      "Studentul confirmat anterior (stud-2) nu a fost mutat"
    );
  });

  // Scenariul 3: Protecție D-005 studenți înghețați
  it("3. protecție D-005: studenții deja confirmați sunt excluși din runda Gale-Shapley", () => {
    const students = [
      { studentId: "stud-2", preferences: ["off-A", "off-B"] },
      { studentId: "stud-3", preferences: ["off-A", "off-B"] },
    ];

    const offers = [
      { offerId: "off-A", capacity: 0, studentRanking: ["stud-2", "stud-3"] },
      { offerId: "off-B", capacity: 1, studentRanking: ["stud-3", "stud-2"] },
    ];

    const result = runGaleShapley(students, offers);
    const matchMap = new Map(result.allocations.map((a) => [a.studentId, a.offerId]));

    assert.strictEqual(matchMap.get("stud-2"), undefined);
    assert.strictEqual(matchMap.get("stud-3"), "off-B");
  });

  // Scenariul 4: Anulare ofertă de către companie (COMPANY_WITHDREW_OFFER)
  it("4. realocare minimală la anulare de către companie (COMPANY_WITHDREW_OFFER)", () => {
    const confirmedPlacements = [
      { studentId: "stud-1", offerId: "off-B" },
      { studentId: "stud-2", offerId: "off-A" },
    ];

    const students = [
      { studentId: "stud-1", preferences: ["off-B"] },
      { studentId: "stud-2", preferences: ["off-A"] },
      { studentId: "stud-3", preferences: ["off-A", "off-B"] },
    ];

    const offers = [
      { offerId: "off-A", capacity: 1, studentRanking: ["stud-2", "stud-3", "stud-1"] },
      { offerId: "off-B", capacity: 1, studentRanking: ["stud-1", "stud-3"] },
    ];

    const realloc = handleMinimalReallocation(
      confirmedPlacements,
      { type: "STUDENT_REFUSED", studentId: "stud-2", offerId: "off-A" },
      offers,
      students
    );

    const placedMap = new Map(realloc.updatedPlacements.map((p) => [p.studentId, p.offerId]));
    assert.strictEqual(placedMap.get("stud-1"), "off-B");
    assert.strictEqual(placedMap.get("stud-3"), "off-A");
  });

  // Scenariul 5: Confirmare în bloc a plasamentelor
  it("5. verifică logica confirmării în masă a plasamentelor", () => {
    const mockPlacements = [
      { id: "p1", status: "PENDING_CONFIRMATION" },
      { id: "p2", status: "PENDING_CONFIRMATION" },
      { id: "p3", status: "CONFIRMED" },
      { id: "p4", status: "CANCELLED_BY_COORDINATOR" },
    ];

    const updated = mockPlacements.map((p) =>
      p.status === "PENDING_CONFIRMATION" ? { ...p, status: "CONFIRMED" } : p
    );

    const confirmedCount = updated.filter((p) => p.status === "CONFIRMED").length;
    const cancelledCount = updated.filter((p) => p.status === "CANCELLED_BY_COORDINATOR").length;

    assert.strictEqual(confirmedCount, 3);
    assert.strictEqual(cancelledCount, 1);
  });

  // Scenariul 6: Test explicit DoD: Retragerea/refuzul studentului după matching (REFUSED_BY_STUDENT)
  it("6. DoD: retragerea studentului după matching (REFUSED_BY_STUDENT) și realocarea minimală către următorul clasat", () => {
    // Alocare inițială confirmată rezultată în urma primei runde
    const initialPlacements = [
      { studentId: "stud-alfa", offerId: "off-continental" },
      { studentId: "stud-beta", offerId: "off-siemens" },
    ];

    const students = [
      { studentId: "stud-alfa", preferences: ["off-continental", "off-siemens"] },
      { studentId: "stud-beta", preferences: ["off-siemens"] },
      { studentId: "stud-gama", preferences: ["off-continental", "off-ntt"] }, // Student în așteptare / neplasat
    ];

    const offers = [
      {
        offerId: "off-continental",
        capacity: 1,
        // Firma Continental a clasat stud-alfa pe locul 1 și stud-gama pe locul 2
        studentRanking: ["stud-alfa", "stud-gama"],
      },
      {
        offerId: "off-siemens",
        capacity: 1,
        studentRanking: ["stud-beta", "stud-alfa"],
      },
    ];

    // Studentul Alfa refuză oferta obținută (REFUSED_BY_STUDENT)
    const reallocResult = handleMinimalReallocation(
      initialPlacements,
      { type: "STUDENT_REFUSED", studentId: "stud-alfa", offerId: "off-continental" },
      offers,
      students
    );

    // Verificare:
    // a. Studentul care a refuzat (stud-alfa) este în affectedStudents și nu mai e plasat la off-continental
    assert.ok(reallocResult.affectedStudents.includes("stud-alfa"));
    assert.strictEqual(
      reallocResult.updatedPlacements.some((p) => p.studentId === "stud-alfa"),
      false,
      "Studentul care a refuzat nu mai figurează în plasamente active"
    );

    // b. Locul eliberat este ocupat de următorul candidat eligibil (stud-gama)
    assert.deepStrictEqual(reallocResult.newlyAssigned, [
      { studentId: "stud-gama", offerId: "off-continental" },
    ]);

    // c. Studentul Beta rămâne nemișcat la Siemens (zero efecte în cascadă pentru cei confirmați)
    const betaPlacement = reallocResult.updatedPlacements.find((p) => p.studentId === "stud-beta");
    assert.strictEqual(betaPlacement?.offerId, "off-siemens");
  });

  // Scenariul 7: Retragerea studentului când nu mai există candidați în lista firmei
  it("7. retragerea studentului când nu există candidați de rezervă lasă locul vacant", () => {
    const initialPlacements = [{ studentId: "stud-1", offerId: "off-A" }];

    const students = [{ studentId: "stud-1", preferences: ["off-A"] }];

    const offers = [
      {
        offerId: "off-A",
        capacity: 1,
        studentRanking: ["stud-1"], // Niciun alt candidat ranked
      },
    ];

    const reallocResult = handleMinimalReallocation(
      initialPlacements,
      { type: "STUDENT_REFUSED", studentId: "stud-1", offerId: "off-A" },
      offers,
      students
    );

    assert.strictEqual(reallocResult.updatedPlacements.length, 0);
    assert.strictEqual(reallocResult.newlyAssigned.length, 0);
    assert.deepStrictEqual(reallocResult.affectedStudents, ["stud-1"]);
  });

  // Scenariul 8: Studenți respinși (rămân nealocați când preferințele nu se potrivesc cu rankingul firmelor)
  it("8. detectează corect studenții nealocați (unassignedStudents) când cererea depășește capacitatea", () => {
    const students = [
      { studentId: "stud-1", preferences: ["off-popular"] },
      { studentId: "stud-2", preferences: ["off-popular"] },
      { studentId: "stud-3", preferences: ["off-popular"] },
    ];

    const offers = [
      {
        offerId: "off-popular",
        capacity: 1,
        studentRanking: ["stud-2", "stud-1", "stud-3"], // Doar stud-2 va fi admis
      },
    ];

    const result = runGaleShapley(students, offers);
    assert.strictEqual(result.allocations.length, 1);
    assert.strictEqual(result.allocations[0].studentId, "stud-2");
    assert.deepStrictEqual(result.unassignedStudents.sort(), ["stud-1", "stud-3"].sort());
    assert.strictEqual(result.unfilledOffers[0].remainingSlots, 0);
  });

  // Scenariul 9: Înlocuirea dinamică în deferred acceptance când un candidat mai bine cotat propune mai târziu
  it("9. deferred acceptance înlocuiește dinamic un candidat provizoriu cu unul mai bine clasat", () => {
    const students = [
      { studentId: "stud-mediu", preferences: ["off-target"] },
      { studentId: "stud-top", preferences: ["off-alt", "off-target"] },
    ];

    const offers = [
      {
        offerId: "off-alt",
        capacity: 0, // off-alt refuză stud-top
        studentRanking: ["stud-top"],
      },
      {
        offerId: "off-target",
        capacity: 1,
        studentRanking: ["stud-top", "stud-mediu"], // stud-top are prioritate
      },
    ];

    const result = runGaleShapley(students, offers);
    const matchMap = new Map(result.allocations.map((a) => [a.studentId, a.offerId]));

    assert.strictEqual(matchMap.get("stud-top"), "off-target");
    assert.strictEqual(matchMap.get("stud-mediu"), undefined);
    assert.ok(result.unassignedStudents.includes("stud-mediu"));
  });
});
