import assert from "assert";
import { sanitizeStudentProfileForCompany, canCompanyAccessStudentCv } from "./privacy";
import prisma from "./prisma";

async function runPrivacyTests() {
  console.log("🧪 Rulare teste Privacy Gate (GDPR P14)...");

  // --- Test 1: sanitizeStudentProfileForCompany ---
  console.log("▶ Test 1: Sanitizare profil student (mascare CV și telefon)...");
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

  console.log("✅ Test 1 Reușit: Filtrarea profilului funcționează conform cerințelor!");

  // --- Test 2: Verificare canCompanyAccessStudentCv cu baza de date ---
  console.log("▶ Test 2: Verificare regulă canCompanyAccessStudentCv (exclusivitate pe StudentPreference)...");
  
  // Căutăm compania demo și un student existent din seed
  const company = await prisma.companyProfile.findFirst({
    include: { offers: true },
  });
  const student = await prisma.studentProfile.findFirst();

  if (company && student && company.offers.length > 0) {
    const offerId = company.offers[0].id;

    // Asigurăm un mediu curat pentru test: ștergem orice preferință sau rank existent între acest student și ofertă
    await prisma.studentPreference.deleteMany({
      where: { studentId: student.id, offerId: offerId },
    });
    await prisma.companyApplicantRank.deleteMany({
      where: { studentId: student.id, offerId: offerId },
    });

    // 2.A: Fără aplicație -> Accesul trebuie să fie strict FALSE
    const accessWithoutApp = await canCompanyAccessStudentCv(company.id, student.id, offerId);
    assert.strictEqual(
      accessWithoutApp,
      false,
      "Firma NU trebuie să aibă acces dacă studentul nu a adăugat oferta în preferințe"
    );

    // 2.B: Doar clasat de firmă (fără ca studentul să fi aplicat) -> Accesul trebuie să rămână FALSE (GDPR rule)
    await prisma.companyApplicantRank.create({
      data: {
        offerId: offerId,
        studentId: student.id,
        rank: 99,
      },
    });
    const accessWithOnlyRank = await canCompanyAccessStudentCv(company.id, student.id, offerId);
    assert.strictEqual(
      accessWithOnlyRank,
      false,
      "Firma NU poate accesa CV-ul chiar dacă l-a clasat unilateral, atâta timp cât studentul NU a aplicat"
    );
    await prisma.companyApplicantRank.deleteMany({
      where: { studentId: student.id, offerId: offerId },
    });

    // 2.C: Studentul adaugă oferta în preferințele sale (StudentPreference) -> Accesul devine TRUE
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
    assert.strictEqual(
      accessWithPref,
      true,
      "Firma TREBUIE să aibă acces dacă studentul a adăugat oferta în preferințe"
    );

    // Curățenie după test
    await prisma.studentPreference.deleteMany({
      where: { studentId: student.id, offerId: offerId },
    });

    console.log("✅ Test 2 Reușit: Regula de exclusivitate pe preferința studentului este respectată cu strictețe!");
  } else {
    console.log("ℹ️ Skipping DB integration test in privacy.test.ts (nu au fost găsite profiluri de test).");
  }

  console.log("\n🎉 Toate testele Privacy Gate au trecut cu succes!");
}

runPrivacyTests().catch((err) => {
  console.error("❌ Testul Privacy Gate a eșuat:", err);
  process.exit(1);
});
