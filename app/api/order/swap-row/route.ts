import { RowSwapBody } from "@/app/types/order";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const body: RowSwapBody = await req.json();
    const { active, over } = body;

    if (!active || !over) {
      throw new Error("Body is not provided");
    }

    await prisma.order.update({
      where: { id: active.id },
      data: { sortOrder: active.sortOrder },
    });
    await prisma.order.update({
      where: { id: over.id },
      data: { sortOrder: over.sortOrder },
    });

    return NextResponse.json("Indexs updated successfully");
  } catch (error) {
    console.log(error);
    new NextResponse(`${error}`);
  }
}
