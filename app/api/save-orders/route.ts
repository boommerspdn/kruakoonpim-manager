import { StoreMenu } from "@/app/types/menu";
import { StoreOrder } from "@/app/types/order";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json();
    const menus: StoreMenu[] = body.menus;
    const orders: StoreOrder[] = body.orders;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    const { start, end } = getDayRange(new Date(date));

    const todayMenu = await prisma.menu.findFirst({
      where: { date: { gte: start, lte: end } },
    });

    if (todayMenu) {
      await Promise.all([
        prisma.menu.deleteMany({ where: { date: { gte: start, lte: end } } }),
        prisma.order.deleteMany({ where: { date: { gte: start, lte: end } } }),
      ]);
    }

    const menuIdMap = new Map<string, string>();
    const generateMenuId = menus.map((menu, index) => {
      const newId = uuidv4();
      menuIdMap.set(menu.id.toString(), newId);
      return { ...menu, id: newId, sortOrder: index, date: new Date(date) };
    });

    await prisma.menu.createMany({
      data: generateMenuId,
    });

    for (const order of orders) {
      const inputName = order.inputName.trim();
      const aiDetectedName = order.customerName.trim();

      const existingCustomer = await prisma.customer.findFirst({
        where: {
          name: {
            equals: inputName,
            mode: "insensitive",
          },
        },
        select: { id: true, name: true, aliases: true },
      });

      let customer;

      if (existingCustomer) {
        const alreadyHasAlias =
          existingCustomer.aliases.includes(aiDetectedName);
        const isMainName = existingCustomer.name === aiDetectedName;

        customer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: inputName,
            aliases:
              !alreadyHasAlias && !isMainName && aiDetectedName !== inputName
                ? { push: aiDetectedName }
                : undefined,
          },
        });
      } else {
        customer = await prisma.customer.create({
          data: {
            id: uuidv4(),
            name: inputName,
            aliases: aiDetectedName !== inputName ? [aiDetectedName] : [],
          },
        });
      }

      await prisma.order.create({
        data: {
          customerId: customer.id,
          delivery: order.delivery,
          note: order.note,
          payment: order.payment,
          date: new Date(date),
          sortOrder: order.sortOrder || 0,
          orderItems: {
            createMany: {
              data: order.orderItems.map((item) => {
                return {
                  menuId: menuIdMap.get(item.menuId.toString()) || "",
                  amount: item.amount || 0,
                };
              }),
            },
          },
        },
      });
    }

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
