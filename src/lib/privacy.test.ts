import assert from "assert";
import { describe, it } from "vitest";
import { sanitizeStudentProfileForCompany, canCompanyAccessStudentCv } from "./privacy";
import prisma from "./prisma";

describe("Privacy Gate (GDPR P14)", () => {
  it("sanitizează profilul studentului dacă nu a aplicat", () => {
    const rawStudent = {
      id: "stud-test-1",
      firstName: "Ion",
      lastName: "Popescu",
      phone: "+40 712 345 678",
      cvUrl: "/uploads/cvs/cv-test.pdf",
      headline: "Student pasionat de CTI",
    };

    // Cazul A: Studentul NU a aplicat la firmă -> datele de contact sunt mascate
    const sanitizedBlocked = sanitizeStudentProfileForCompany(rawStudent, false);
    assert.strictEqual(sanitizedBlocked.phone, null, "Telefonul trebuie să fie null dacă studentul nu a aplicat");
    assert.strictEqual(sanitizedBlocked.cvUrl, null, "CV-ul trebuie să fie null dacă studentul nu a aplicat");
    assert.strictEqual(sanitizedBlocked.headline, "Student pasionat de CTI", "Headline-ul public trebuie păstrat");

    // Cazul B: Studentul a aplicat la firmă -> datele sunt vizibile
    const sanitizedAllowed = sanitizeStudentProfileForCompany(rawStudent, true);
    assert.strictEqual(sanitizedAllowed.phone, "+40 712 345 678", "Telefonul trebuie să fie vizibil dacă a aplicat");
    assert.strictEqual(sanitizedAllowed.cvUrl, "/uploads/cvs/cv-test.pdf", "CV-ul trebuie să fie vizibil dacă a aplicat");
  });

  it("verifică regula canCompanyAccessStudentCv în raport cu preferințele din DB", async () => {
    const company = await prisma.companyProfile.findFirst({
      include: { offers: true },
    });
    const student = await prisma.studentProfile.findFirst();

    if (company && student && company.offers.length > 0) {
      const offerId = company.offers[0].id;

      await prisma.studentPreference.deleteMany({
        where: { studentId: student.id, offerId: offerId },
      });
      await prisma.companyApplicantRank.deleteMany({
        where: { studentId: student.id, offerId: offerId },
      });

      // 2.A: Fără aplicație -> Accesul este strict FALSE
      const accessWithoutApp = await canCompanyAccessStudentCv(company.id, student.id, offerId);
      assert.strictEqual(accessWithoutApp, false);

      // 2.B: Doar clasat de firmă fără aplicare de la student -> Rămâne FALSE
      await prisma.companyApplicantRank.create({
        data: {
          offerId: offerId,
          studentId: student.id,
          rank: 99,
        },
      });
      const accessWithOnlyRank = await canCompanyAccessStudentCv(company.id, student.id, offerId);
      assert.strictEqual(accessWithOnlyRank, false);
      await prisma.companyApplicantRank.deleteMany({
        where: { studentId: student.id, offerId: offerId },
      });

      // 2.C: Studentul adaugă în preferințe -> TRUE
      const highestPref = await prisma.studentPreference.findFirst({
        where: { studentId: student.id },
        orderBy: { rank: "desc" },
      });
      const nextRank = (highestPref?.rank || 0) + 1;

      await prisma.studentPreference.create({
        data: {
          studentId: student.id,
          offerId: offerId,
          rank: nextRank,
        },
      });

      const accessWithPref = await canCompanyAccessStudentCv(company.id, student.id, offerId);
      assert.strictEqual(accessWithPref, true);

      // Curățenie
      await prisma.studentPreference.deleteMany({
        where: { studentId: student.id, offerId: offerId },
      });
    }
  });
});
