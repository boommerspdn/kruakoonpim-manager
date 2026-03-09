import { Prisma } from "@/app/generated/prisma";
import { CreateMenu } from "@/app/types/menu";
import { CreateOrder } from "@/app/types/order";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

type ExtraInput = {
  finalCustomerId: string;
  inputName: string;
  sortOrder: number;
};

type Order = CreateOrder & ExtraInput;

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json();

    const menus: CreateMenu[] = body.menus;
    const orders: Order[] = body.orders;

    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    const { start, end } = getDayRange(new Date(date));

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        await Promise.all([
          tx.menu.deleteMany({ where: { date: { gte: start, lte: end } } }),
          tx.order.deleteMany({ where: { date: { gte: start, lte: end } } }),
        ]);

        const menusWithNewIds = menus.map((m: CreateMenu) => ({
          ...m,
          generatedId: uuidv4(),
        }));

        const menuIdMap = new Map(
          menusWithNewIds.map((m) => [
            m.id?.toString() || uuidv4(),
            m.generatedId,
          ]),
        );

        await tx.menu.createMany({
          data: menusWithNewIds.map((menu) => ({
            id: menu.generatedId,
            name: menu.name,
            amount: menu.amount || 0,
            price: menu.price || 0,
            sortOrder: menu.sortOrder || 0,
            date: new Date(date),
          })),
        });

        await Promise.all(
          orders.map(async (order) => {
            await tx.order.create({
              data: {
                delivery: order.delivery || false,
                note: order.note,
                payment: order.payment,
                status: order.status,
                sortOrder: order.sortOrder,
                date: new Date(date),
                customer: order.inputName
                  ? {
                      connectOrCreate: {
                        where: { name: order.inputName },
                        create: { name: order.inputName },
                      },
                    }
                  : undefined,
                orderItems: {
                  createMany: {
                    data: order.orderItems.map((item) => {
                      const finalMenuId = menuIdMap.get(item.menuId);
                      if (!finalMenuId)
                        throw new Error(
                          `Menu ID ${item.menuId} not found in map`,
                        );

                      return {
                        menuId: finalMenuId,
                        amount: item.amount || 0,
                      };
                    }),
                  },
                },
              },
            });
          }),
        );
      },
      {
        maxWait: 60000,
        timeout: 60000,
      },
    );

    return NextResponse.json(
      { success: true, message: "เพิ่มเมนู/ออเดอร์สำเร็จ" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Save Orders Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
