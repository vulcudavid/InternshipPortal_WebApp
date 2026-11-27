import { NextRequest, NextResponse } from "next/server";
import { loginUser, isDemoLoginEnabled } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      {
        error: "403 Forbidden: Autentificarea demo este dezactivată în producție.",
        code: "DEMO_LOGIN_DISABLED",
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { role } = body;

    const demoAccounts: Record<string, { email: string; pass: string }> = {
      STUDENT: { email: "alexandru.radu@student.ulbsibiu.ro", pass: "DemoStudent2026!" },
      COMPANY_TUTOR: { email: "recruitment@continental-sibiu.com", pass: "DemoCompany2026!" },
      COORDINATOR: {
        email: "coordonator.practica@ulbsibiu.ro",
        pass: process.env.COORDINATOR_SEED_PASSWORD || "CoordULBS2026!",
      },
      ADMIN: {
        email: "admin@ulbsibiu.ro",
        pass: process.env.ADMIN_SEED_PASSWORD || "AdminULBS2026!",
      },
    };

    const creds = demoAccounts[role];
    if (!creds) {
      return NextResponse.json(
        { error: "Rol demo invalid. Valori permise: STUDENT, COMPANY_TUTOR, COORDINATOR, ADMIN." },
        { status: 400 }
      );
    }

    const user = await loginUser(creds.email, creds.pass);
    return NextResponse.json({
      success: true,
      message: `Autentificare demo ca ${role} reușită.`,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error: any) {
    const status = error?.message?.includes("403 Forbidden") ? 403 : 400;
    return NextResponse.json(
      { error: error?.message || "Eroare la autentificare demo." },
      { status }
    );
  }
}

export async function GET() {
  if (!isDemoLoginEnabled()) {
    return NextResponse.json(
      {
        error: "403 Forbidden: Autentificarea demo este dezactivată în producție.",
        code: "DEMO_LOGIN_DISABLED",
      },
      { status: 403 }
    );
  }

  return NextResponse.json({
    status: "DEMO_LOGIN_ENABLED",
    roles: ["STUDENT", "COMPANY_TUTOR", "COORDINATOR", "ADMIN"],
  });
}
