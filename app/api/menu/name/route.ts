import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const menu = await prisma.menu.findMany({
      where: {
        name: { not: "" },
      },
      select: { name: true },
      distinct: ["name"],
      orderBy: { name: "asc" },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}
