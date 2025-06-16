import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function getDayRange(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}

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
    const body: { menu: { name: string; amount: number; price: number }[] } =
      await req.json();
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body.menu || body.menu.length === 0)
      throw new Error("Body was not included");

    const menu = await prisma.menu.createMany({
      data: body.menu.map((item, index) => ({
        ...item,
        date: new Date(date),
        sortOrder: index,
      })),
    });

    return NextResponse.json(menu);
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: {
      id: string;
      name: string;
      amount: number;
      price: number;
      sortOrder: number;
    }[] = await req.json();
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body || body.length === 0) throw new Error("Body was not included");

    const { start, end } = getDayRange(new Date(date));

    // 1. Get existing item IDs in the DB
    const existingItems = await prisma.menu.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: { id: true },
    });

    const existingIds = existingItems.map((item) => item.id);
    const newIds = body.map((item) => item.id).filter(Boolean) as string[];

    // 2. Calculate which IDs to delete
    const toDelete = existingIds.filter((id) => !newIds.includes(id));

    const upsertOps = body.map((item) =>
      prisma.menu.upsert({
        where: { id: item.id || "00000000-0000-0000-0000-000000000000" }, // Dummy UUID if no id
        update: {
          name: item.name,
          price: item.price,
          amount: item.amount,
          sortOrder: item.sortOrder,
        },
        create: {
          name: item.name,
          price: item.price,
          amount: item.amount,
          date: new Date(date),
          sortOrder: item.sortOrder,
        },
      }),
    );

    // 4. Run everything in a transaction
    await prisma.$transaction([
      // Delete old items
      prisma.menu.deleteMany({
        where: {
          id: { in: toDelete },
        },
      }),
      // Upsert all items
      ...upsertOps,
    ]);

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

    const menu = await prisma.menu.deleteMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
    });

    return NextResponse.json(menu);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}
