import { sendVerificationCodeEmail } from "./mailer";

async function runMailTest() {
  const targetEmail = process.argv[2] || process.env.SMTP_USER;

  console.log("📬 Test expediere email prin serviciul SMTP...");

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("\n⚠️ Variabilele SMTP nu sunt complet setate în .env!");
    console.warn("Verifică dacă ai adăugat: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM.");
    console.warn("În acest moment se va folosi modul [FALLBACK] în consolă.\n");
  }

  if (!targetEmail) {
    console.error("❌ Te rugăm să specifici o adresă de destinație: npm run test:mail adresa@student.ulbsibiu.ro");
    process.exit(1);
  }

  const testCode = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`Destinatar: ${targetEmail}`);
  console.log(`Cod OTP de test generat: ${testCode}\n`);

  const result = await sendVerificationCodeEmail(
    targetEmail,
    "Student Test ULBS",
    testCode
  );

  if (result.success && !result.fallback) {
    console.log("✅ Emailul de verificare a fost expediat cu succes prin SMTP!");
    console.log(`Verifică căsuța poștală a adresei ${targetEmail} (inclusiv folderul Spam).`);
  } else if (result.fallback) {
    console.log("ℹ️ A rulat în modul Fallback (nu s-a trimis pe internet, ci doar în consolă).");
  } else {
    console.error("❌ Trimiterea a eșuat. Verifică datele de autentificare din .env.");
  }
}

runMailTest().catch((err) => {
  console.error("Eroare neașteptată:", err);
  process.exit(1);
});
