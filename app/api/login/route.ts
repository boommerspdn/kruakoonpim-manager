import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { passcode } = await req.json();

  if (passcode === process.env.LOGIN_PASSCODE) {
    const res = NextResponse.json({ success: true });
    const isDev = process.env.NODE_ENV !== "production";

    res.cookies.set("session", "valid", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      secure: !isDev,
      sameSite: isDev ? "lax" : "none",
    });

    return res;
  }

  return NextResponse.json(
    { success: false, message: "Invalid passcode" },
    { status: 401 },
  );
}
