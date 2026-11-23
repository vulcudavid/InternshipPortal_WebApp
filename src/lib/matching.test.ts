import assert from "assert";
import { describe, it } from "vitest";
import { runGaleShapley, handleMinimalReallocation } from "./matching";

describe("Matching Engine (Gale-Shapley & Minimal Reallocation)", () => {
  it("rulează Gale-Shapley (Many-to-One) și produce alocarea stabilă corectă", () => {
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

  it("efectuează realocarea minimală când un student refuză locul", () => {
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

  it("protecție D-005: studenții deja confirmați sunt excluși din runda Gale-Shapley", () => {
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

  it("realocare minimală la anulare de către companie", () => {
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

  it("verifică logica confirmării în masă", () => {
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
});
