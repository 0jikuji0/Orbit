import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Vérification optimiste : présence du cookie de session uniquement (pas d'accès BDD ici).
 * La validation réelle de la session est faite côté serveur par `lib/permissions.ts`.
 */
const PUBLIC_PATHS = ["/login", "/register", "/api/auth", "/api/health"];

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (getSessionCookie(request)) return NextResponse.next();

  const url = new URL("/login", request.url);
  if (pathname !== "/") url.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico|webp)$).*)"],
};
