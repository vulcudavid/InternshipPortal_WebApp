import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get("web2_session_user_id");

  // Verificare pentru endpoint-uri API de administrare
  if (pathname.startsWith("/api/admin")) {
    if (!sessionCookie?.value) {
      return NextResponse.json(
        {
          error: "Acces interzis. Rolul ADMIN este obligatoriu.",
          code: "FORBIDDEN",
        },
        { status: 403 }
      );
    }
    return NextResponse.next();
  }

  // Verificare pentru rutele UI de administrare (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!sessionCookie?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
