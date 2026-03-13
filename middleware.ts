import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const session = req.cookies.get("session")?.value;
  const apiKey = req.headers.get("x-api-key");
  const { pathname } = req.nextUrl;

  const isValidApiKey = apiKey === process.env.INTERNAL_API_KEY;

  const isApiRequest = pathname.startsWith("/api");
  const isJsonExpected = req.headers
    .get("accept")
    ?.includes("application/json");

  if (isApiRequest || isJsonExpected) {
    if (session || isValidApiKey) {
      return NextResponse.next();
    }

    return NextResponse.json(
      { error: "Unauthorized", message: "Invalid or missing API Key/Session" },
      { status: 401 },
    );
  }

  if (!session && !pathname.startsWith("/login")) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|manifest|sw\\.js|icon|api/login|api/logout|login|auth).*)",
  ],
};
