import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const body: {
      oldIndex: { id: string; index: number };
      newIndex: { id: string; index: number };
    } = await req.json();
    const { oldIndex, newIndex } = body;

    if (!oldIndex || !newIndex) {
      throw new Error("Body is not provided");
    }

    await prisma.order.update({
      where: { id: oldIndex.id },
      data: { sortOrder: newIndex.index },
    });
    await prisma.order.update({
      where: { id: newIndex.id },
      data: { sortOrder: oldIndex.index },
    });

    return NextResponse.json("Indexs updated successfully");
  } catch (error) {
    console.log(error);
    new NextResponse(`${error}`);
  }
}
