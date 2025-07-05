import { PostMenu, PatchMenu } from "@/app/types/menu";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");

    const { start, end } = getDayRange(new Date(date));

    const menu = await prisma.menu.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: PostMenu = await req.json();
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body || body.length === 0) throw new Error("Body was not included");

    await prisma.menu.createMany({
      data: body.map((item, index) => ({
        name: item.name,
        amount: item.amount,
        price: item.price,
        date: new Date(date),
        sortOrder: index,
      })),
    });

    return NextResponse.json("Menu created successfully");
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: PatchMenu = await req.json();
    const { toCreate, toUpdate, toDeleteIds } = body;
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body) throw new Error("Body was not included");

    await prisma.menu.createMany({
      data: toCreate.map((item) => ({
        ...item,
        date: new Date(date),
      })),
    });

    for (const updateItem of toUpdate) {
      await prisma.menu.updateMany({
        where: { id: updateItem.id },
        data: {
          name: updateItem.changes.name,
          amount: updateItem.changes.amount,
          price: updateItem.changes.price,
          sortOrder: updateItem.changes.sortOrder,
        },
      });
    }

    await prisma.menu.deleteMany({ where: { id: { in: toDeleteIds } } });

    return new NextResponse("Edited Successfully");
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");

    const { start, end } = getDayRange(new Date(date));

    const deleteMenu = prisma.menu.deleteMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    const deleteOrder = prisma.order.deleteMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    await prisma.$transaction([deleteMenu, deleteOrder]);

    return NextResponse.json("Menu deleted successfully");
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}
