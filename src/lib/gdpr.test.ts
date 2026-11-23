/**
 * Suita de teste GDPR — anonymizeStudentProfile
 */
import assert from "assert";
import { describe, it } from "vitest";
import prisma from "@/lib/prisma";
import { anonymizeStudentProfile } from "@/lib/gdpr";

describe("GDPR Erasure & Anonymization (Art. 17)", () => {
  it("anonimizează profilul studentului, șterge PII și păstrează integritatea", async () => {
    const testEmail = `test-gdpr-${Date.now()}@test.ulbsibiu.ro`;

    // 1. Creăm user de test cu profil student
    const user = await prisma.user.create({
      data: {
        email: testEmail,
        passwordHash: "hash_test",
        firstName: "Ion",
        lastName: "Popescu",
        role: "STUDENT",
        studentProfile: {
          create: {
            specialization: "Calculatoare",
            studyYear: 2,
            group: "CTI-1",
            phone: "0712345678",
            cvUrl: "cv-test.pdf",
            bio: "Bio test",
            headline: "Headline test",
            githubUrl: "https://github.com/test",
            linkedinUrl: "https://linkedin.com/in/test",
            portfolioUrl: "https://portfolio.test",
            gdprConsent: true,
            gdprConsentAt: new Date(),
          },
        },
      },
      include: { studentProfile: true },
    });

    const studentId = user.studentProfile!.id;

    // 2. Apelăm funcţia de anonimizare
    await anonymizeStudentProfile(studentId);

    // 3. Citim datele actualizate din DB
    const updatedUser = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    const updatedProfile = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: studentId },
    });

    // 4. Verificări
    assert.strictEqual(updatedUser.firstName, "Student", "firstName trebuie să fie 'Student'");
    assert.strictEqual(updatedUser.lastName, "[Anonimizat]", "lastName trebuie să fie '[Anonimizat]'");
    assert.ok(
      updatedUser.email.includes("gdpr-erased"),
      `email-ul trebuie să conţină 'gdpr-erased', primit: ${updatedUser.email}`
    );
    assert.strictEqual(updatedProfile.phone, null, "phone trebuie să fie null");
    assert.strictEqual(updatedProfile.cvUrl, null, "cvUrl trebuie să fie null");
    assert.strictEqual(updatedProfile.bio, null, "bio trebuie să fie null");
    assert.strictEqual(updatedProfile.headline, null, "headline trebuie să fie null");
    assert.strictEqual(updatedProfile.githubUrl, null, "githubUrl trebuie să fie null");
    assert.strictEqual(updatedProfile.linkedinUrl, null, "linkedinUrl trebuie să fie null");
    assert.strictEqual(updatedProfile.portfolioUrl, null, "portfolioUrl trebuie să fie null");
    assert.strictEqual(updatedProfile.gdprConsent, false, "gdprConsent trebuie să fie false");
    assert.strictEqual(updatedProfile.gdprConsentAt, null, "gdprConsentAt trebuie să fie null");
    assert.strictEqual(updatedUser.isActive, false, "isActive trebuie să fie false");

    // 5. Curăţare date de test
    await prisma.user.delete({ where: { id: user.id } });
  });
});
