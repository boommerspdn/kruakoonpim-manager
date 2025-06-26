import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const body: {
      oldId: string;
      newId: string;
    } = await req.json();
    const { oldId, newId } = body;

    if (!oldId || !newId) {
      throw new Error("Body is not provided");
    }

    const oldIndexSort = await prisma.order.findFirst({
      where: {
        id: oldId,
      },
    });
    const newIndexSort = await prisma.order.findFirst({
      where: {
        id: newId,
      },
    });

    await prisma.order.update({
      where: { id: oldId },
      data: { sortOrder: newIndexSort?.sortOrder },
    });
    await prisma.order.update({
      where: { id: newId },
      data: { sortOrder: oldIndexSort?.sortOrder },
    });

    return NextResponse.json("Indexs updated successfully");
  } catch (error) {
    console.log(error);
    new NextResponse(`${error}`);
  }
}
