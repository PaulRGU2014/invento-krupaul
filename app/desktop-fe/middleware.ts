import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const supported = new Set(["en", "th"]);

export function middleware(req: NextRequest) {
  const cookieLocale = req.cookies.get("locale")?.value;
  let locale = cookieLocale;

  if (!locale) {
    const accept = req.headers.get("accept-language") || "";
    const first = accept.split(",")[0]?.split("-")[0] || "en";
    locale = supported.has(first) ? first : "en";
  }

  // Persist cookie if missing or changed
  const res = NextResponse.next();
  if (!cookieLocale || cookieLocale !== locale) {
    res.cookies.set("locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
  }

  return res;
}

export const config = {
  matcher: ["/:path*"],
};
