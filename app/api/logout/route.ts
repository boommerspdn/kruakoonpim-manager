import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ success: true });

  // Clear the cookie by setting it to expire in the past
  res.cookies.set("session", "", {
    path: "/",
    maxAge: 0, // instantly expire
  });

  return res;
}
