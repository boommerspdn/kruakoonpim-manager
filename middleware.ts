import { NextRequest, NextResponse } from "next/server";

export async function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|robots\\.txt|manifest|sw\\.js|icon|api/login|api/logout|login|auth).*)",
  ],
};
