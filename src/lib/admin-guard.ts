import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { UserRole } from "@prisma/client";

/**
 * Guard intern pentru Server Actions & operațiuni backend.
 * Aruncă eroare dacă utilizatorul nu este autentificat sau nu are rolul ADMIN.
 */
export async function requireAdminUser() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN || !user.isActive) {
    throw new Error("Acces interzis. Rolul ADMIN este obligatoriu.");
  }

  return user;
}

/**
 * Guard dedicat pentru Route Handlers (NextResponse).
 * Returnează HTTP 403 Forbidden dacă cererea nu provine de la un ADMIN activ.
 */
export async function checkAdminApiAuth() {
  const user = await getCurrentUser();

  if (!user || user.role !== UserRole.ADMIN || !user.isActive) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Acces interzis. Rolul ADMIN este obligatoriu.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}
