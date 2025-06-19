import { TableRowData } from "@/components/dashboard-content";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export type OrderBody = {
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

    const order = await prisma.order.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      include: { orderItems: true },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(order);
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

    for (const order of body) {
      await prisma.order.create({
        data: {
          customerName: order.customerName,
          date: new Date(date),
          sortOrder: order.sortOrder,
          note: order.note,
          delivery: order.delivery,
          orderItems: {
            create: order.orderItems
              .filter((orderItem) => orderItem.amount !== 0)
              .map((orderItem) => ({
                menuId: orderItem.menuId,
                amount: orderItem.amount,
              })),
          },
        },
      });
    }

    return NextResponse.json("Order created successfully");
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}
