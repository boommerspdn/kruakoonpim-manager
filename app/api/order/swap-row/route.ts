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

    const getActiveOrder = await prisma.order.findFirst({
      where: { id: active },
      select: { sortOrder: true },
    });
    const getOverOrder = await prisma.order.findFirst({
      where: { id: over },
      select: { sortOrder: true },
    });

    await prisma.order.update({
      where: { id: active },
      data: { sortOrder: getOverOrder?.sortOrder },
    });
    await prisma.order.update({
      where: { id: over },
      data: { sortOrder: getActiveOrder?.sortOrder },
    });

    return NextResponse.json("Indexs updated successfully");
  } catch (error) {
    console.log(error);
    new NextResponse(`${error}`);
  }
}
