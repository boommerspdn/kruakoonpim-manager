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
          where: {
            date: {
              gte: start,
              lte: end,
            },
          },
        });

        if (todayMenu) {
          await tx.menu.deleteMany({
            where: {
              date: {
                gte: start,
                lte: end,
              },
            },
          });

          await tx.order.deleteMany({
            where: {
              date: {
                gte: start,
                lte: end,
              },
            },
          });
        }

        for (const [index, m] of menus.entries()) {
          const createMenu = await tx.menu.create({
            data: {
              name: m.name,
              price: m.price || 0,
              date: new Date(date),
              amount: m.amount || 0,
              sortOrder: index || 0,
            },
          });
          menuIdMap.set(m.id.toString(), createMenu.id.toString());
        }

        for (const order of orders) {
          const customerId = order.finalCustomerId;

          if (!customerId) {
            await tx.customer.create({
              data: {
                name: order.inputName.trim(),
                aliases: [order.customerName.trim()],
              },
            });
          } else {
            if (order.customerName !== order.inputName) {
              const findScalar = await tx.customer.findFirst({
                where: {
                  id: customerId,
                  aliases: {
                    has: order.customerName.trim(),
                  },
                },
                select: {
                  id: true,
                  name: true,
                },
              });

              if (!findScalar) {
                await tx.customer.update({
                  where: { id: customerId },
                  data: {
                    aliases: { push: order.customerName.trim() },
                  },
                });
              }
            }
          }

          await tx.order.create({
            data: {
              customerId: customerId,
              note: order.note || null,
              delivery: order.delivery,
              date: new Date(date),
              sortOrder: order.sortOrder || 0,
              orderItems: {
                create: order.orderItems.map(
                  (item: { menuId: string; amount: number }) => ({
                    menuId: menuIdMap.get(item.menuId.toString()),
                    amount: item.amount || 0,
                  }),
                ),
              },
            },
          });
        }
      },
      { timeout: 60000 },
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
