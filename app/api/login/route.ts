// /app/api/login/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email, password } = await req.json();

  if (
    email === process.env.LOGIN_USERNAME &&
    password === process.env.LOGIN_PASSWORD
  ) {
    const res = NextResponse.json({ success: true });
    // Set "infinite" cookie (~10 years)
    const isDev = process.env.NODE_ENV !== "production";

    res.cookies.set("session", "valid", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      secure: !isDev, // true in prod only
      sameSite: isDev ? "lax" : "none", // use "Lax" in dev to allow http
    });

    return res;
  }

  return NextResponse.json(
    { success: false, message: "Invalid credentials" },
    { status: 401 },
  );
}
