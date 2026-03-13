import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { passcode } = await req.json();

  if (passcode === process.env.LOGIN_PASSCODE) {
    const res = NextResponse.json({ success: true });

    res.cookies.set("session", "valid", {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    return res;
  }

  return NextResponse.json(
    { success: false, message: "Invalid passcode" },
    { status: 401 },
  );
}
