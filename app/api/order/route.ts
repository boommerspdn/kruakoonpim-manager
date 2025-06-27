import { TableRowData } from "@/components/dashboard-content";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export type OrderBody = {
  id: string;
  customerName: string;
  sortOrder: number;
  note: string;
  delivery: boolean;
  orderItems: { menuId: string; amount: number }[];
};

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");

    const { start, end } = getDayRange(new Date(date));

    const orders = await prisma.order.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: { orderItems: { include: { menu: true } } },
      orderBy: { sortOrder: "asc" },
    });

    const ordersWithTotal = orders.map((order) => {
      // Calculate each item total
      const itemTotals = order.orderItems.map(
        (item) => item.amount * item.menu.price,
      );

      // Sum up item totals
      const totalPrice = itemTotals.reduce((sum, val) => sum + val, 0);

      return {
        ...order,
        totalPrice,
      };
    });

    return NextResponse.json(ordersWithTotal);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: OrderBody[] = await req.json();
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body) throw new Error("Body was not included");

    const { start, end } = getDayRange(new Date(date));

    const existingItems = await prisma.order.findMany({
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

    for (const order of body) {
      const upsertedOrder = await prisma.order.upsert({
        where: {
          id: order.id || "00000000-0000-0000-0000-000000000000",
        },
        create: {
          customerName: order.customerName,
          date: new Date(date),
          sortOrder: order.sortOrder,
          note: order.note,
          delivery: order.delivery,
          orderItems: {
            create: order.orderItems
              .filter((item) => item.amount !== 0)
              .map((item) => ({
                menuId: item.menuId,
                amount: item.amount,
              })),
          },
        },
        update: {
          customerName: order.customerName,
          date: new Date(date),
          sortOrder: order.sortOrder,
          note: order.note,
          delivery: order.delivery,
        },
      });

      // Upsert orderItems manually (after order upserted)
      for (const item of order.orderItems) {
        if (item.amount === 0) continue;

        await prisma.orderItem.upsert({
          where: {
            orderId_menuId: {
              orderId: upsertedOrder.id,
              menuId: item.menuId,
            },
          },
          update: {
            amount: item.amount,
          },
          create: {
            orderId: upsertedOrder.id,
            menuId: item.menuId,
            amount: item.amount,
          },
        });
      }
    }

    // 4. Run everything in a transaction
    await prisma.$transaction([
      // Delete old items
      prisma.order.deleteMany({
        where: {
          id: { in: toDelete },
        },
      }),
    ]);

    return NextResponse.json("Order created successfully");
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}
