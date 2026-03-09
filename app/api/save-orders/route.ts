import { Prisma } from "@/app/generated/prisma";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json();
    const { menus, orders } = body;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    const { start, end } = getDayRange(new Date(date));

    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const menuIdMap = new Map<string, string>();

        const todayMenu = await tx.menu.findFirst({
          where: { date: { gte: start, lte: end } },
        });

        if (todayMenu) {
          await Promise.all([
            tx.menu.deleteMany({ where: { date: { gte: start, lte: end } } }),
            tx.order.deleteMany({ where: { date: { gte: start, lte: end } } }),
          ]);
        }

        const createdMenus = await Promise.all(
          menus.map((m: any, index: number) =>
            tx.menu.create({
              data: {
                name: m.name,
                price: m.price || 0,
                date: new Date(date),
                amount: m.amount || 0,
                sortOrder: index || 0,
              },
            }),
          ),
        );

        createdMenus.forEach((newMenu, index) => {
          menuIdMap.set(menus[index].id.toString(), newMenu.id.toString());
        });

        await Promise.all(
          orders.map(async (order: any) => {
            let currentCustomerId = order.finalCustomerId;

            if (!currentCustomerId) {
              const newCustomer = await tx.customer.create({
                data: {
                  name: order.inputName.trim(),
                  aliases: [order.customerName.trim()],
                },
              });
              currentCustomerId = newCustomer.id;
            } else {
              if (order.customerName !== order.inputName) {
                const findScalar = await tx.customer.findFirst({
                  where: {
                    id: currentCustomerId,
                    aliases: { has: order.customerName.trim() },
                  },
                  select: { id: true },
                });

                if (!findScalar) {
                  await tx.customer.update({
                    where: { id: currentCustomerId },
                    data: { aliases: { push: order.customerName.trim() } },
                  });
                }
              }
            }

            await tx.order.create({
              data: {
                customerId: currentCustomerId,
                note: order.note || null,
                delivery: order.delivery,
                date: new Date(date),
                sortOrder: order.sortOrder || 0,
                orderItems: {
                  create: order.orderItems.map(
                    (item: { menuId: string; amount: number }) => ({
                      menuId: menuIdMap.get(item.menuId.toString()) || "",
                      amount: item.amount || 0,
                    }),
                  ),
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
      {
        success: true,
        message: "เพิ่มเมนู/ออเดอร์สำเร็จ",
      },
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
