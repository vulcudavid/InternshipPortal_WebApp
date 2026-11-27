import nodemailer from "nodemailer";

/**
 * Serviciu de expediere emailuri de verificare OTP pentru Portalul de Practică ULBS
 */
export async function sendVerificationCodeEmail(
  toEmail: string,
  fullName: string,
  code: string
): Promise<{ success: boolean; fallback?: boolean }> {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || "no-reply@ulbsibiu.ro";
  const senderName = process.env.BREVO_SENDER_NAME || "Portal Practică ULBS";

  const subject = `Cod de verificare email Portal Practică ULBS: ${code}`;
  const text = `Bună ziua, ${fullName},\n\nCodul dumneavoastră de verificare pentru activarea contului de student pe Portalul de Practică ULBS este: ${code}.\n\nCodul este valabil timp de 15 minute.\n\nDacă nu ați solicitat acest cod, vă rugăm să ignorați acest mesaj.\n\nFacultatea de Inginerie • Universitatea „Lucian Blaga” din Sibiu`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #0369a1; margin: 0;">Portal Practică ULBS</h2>
        <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Facultatea de Inginerie • Universitatea „Lucian Blaga” din Sibiu</p>
      </div>
      <p style="color: #334155; font-size: 15px;">Bună ziua, <strong>${fullName}</strong>,</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.5;">
        Vă mulțumim pentru înregistrarea pe portalul oficial de practică. Pentru a vă activa contul de student instituțional, introduceți codul de verificare de mai jos:
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0284c7; background: #f0f9ff; padding: 14px 28px; border: 2px dashed #0284c7; border-radius: 10px;">
          ${code}
        </span>
      </div>
      <p style="color: #64748b; font-size: 13px; text-align: center;">
        Codul este valabil timp de <strong>15 minute</strong>.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
        Acest mesaj a fost generat automat. Vă rugăm să nu răspundeți la acest email.
      </p>
    </div>
  `;

  // 1. Trimitere prioritară prin Brevo HTTP API (port 443 — neblocat pe Railway)
  if (brevoApiKey) {
    try {
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          accept: "application/json",
          "api-key": brevoApiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email: toEmail, name: fullName }],
          subject,
          textContent: text,
          htmlContent: html,
        }),
      });

      if (!response.ok) {
        const errorDetails = await response.text();
        throw new Error(`Brevo API ${response.status}: ${errorDetails}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Eroare la trimiterea emailului prin Brevo API:", error);
      console.log(`[MAILER FALLBACK] Code for ${toEmail}: ${code}`);
      return { success: false, fallback: true };
    }
  }

  // 2. Fallback SMTP (local sau servere cu porturi SMTP deschise)
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"${senderName}" <${senderEmail}>`;

  if (!host) {
    console.log(`[MAILER FALLBACK] Code for ${toEmail}: ${code}`);
    return { success: true, fallback: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      connectionTimeout: 5000,
      greetingTimeout: 5000,
      auth: user && pass ? { user, pass } : undefined,
    });

    await transporter.sendMail({ from, to: toEmail, subject, text, html });
    return { success: true };
  } catch (error) {
    console.error("Eroare la trimiterea emailului SMTP:", error);
    console.log(`[MAILER FALLBACK] Code for ${toEmail}: ${code}`);
    return { success: false, fallback: true };
  }
}
