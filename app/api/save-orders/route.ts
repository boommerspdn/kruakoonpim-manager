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

    // Phase 1: Collect all unique input names
    const uniqueInputNames = [...new Set(orders.map((o) => o.inputName.trim()))];

    // Phase 2: Fetch all matching customers in one query
    const existingCustomers = await prisma.customer.findMany({
      where: {
        name: { in: uniqueInputNames, mode: "insensitive" },
      },
      select: { id: true, name: true, aliases: true },
    });

    const existingMap = new Map(
      existingCustomers.map((c) => [c.name.toLowerCase(), c])
    );

    // Phase 3: Split into creates vs updates
    const toCreate: { id: string; name: string; aliases: string[] }[] = [];
    const toUpdate: { id: string; inputName: string; aliases: string[] }[] = [];
    const processedNames = new Set<string>();

    for (const order of orders) {
      const inputName = order.inputName.trim();
      const aiDetectedName = order.customerName.trim();
      const key = inputName.toLowerCase();

      if (processedNames.has(key)) continue;
      processedNames.add(key);

      const existing = existingMap.get(key);

      if (existing) {
        const alreadyHasAlias = existing.aliases.includes(aiDetectedName);
        const isMainName = existing.name === aiDetectedName;

        toUpdate.push({
          id: existing.id,
          inputName,
          aliases:
            !alreadyHasAlias && !isMainName && aiDetectedName !== inputName
              ? [...existing.aliases, aiDetectedName]
              : existing.aliases,
        });
      } else {
        toCreate.push({
          id: uuidv4(),
          name: inputName,
          aliases: aiDetectedName !== inputName ? [aiDetectedName] : [],
        });
      }
    }

    // Phase 4: Batch create new customers
    if (toCreate.length > 0) {
      await prisma.customer.createMany({ data: toCreate });
    }

    // Phase 5: Sequential update to avoid race condition on same customer
    for (const c of toUpdate) {
      await prisma.customer.update({
        where: { id: c.id },
        data: { name: c.inputName, aliases: c.aliases },
      });
    }

    // Phase 6: Re-fetch all customers to build ID map
    const allCustomers = await prisma.customer.findMany({
      where: { name: { in: uniqueInputNames, mode: "insensitive" } },
      select: { id: true, name: true },
    });
    const customerIdMap = new Map(
      allCustomers.map((c) => [c.name.toLowerCase(), c.id])
    );

    // Phase 7: Create all orders + orderItems in 2 bulk queries
    const orderIds = orders.map(() => uuidv4());

    await prisma.order.createMany({
      data: orders.map((order, i) => ({
        id: orderIds[i],
        customerId: customerIdMap.get(order.inputName.trim().toLowerCase()) || "",
        delivery: order.delivery,
        note: order.note,
        payment: order.payment,
        date: new Date(date),
        sortOrder: order.sortOrder || 0,
      })),
    });

    await prisma.orderItem.createMany({
      data: orders.flatMap((order, i) =>
        order.orderItems.map((item) => ({
          orderId: orderIds[i],
          menuId: menuIdMap.get(item.menuId.toString()) || "",
          amount: item.amount || 0,
        }))
      ),
    });

    return NextResponse.json(
      {
        success: true,
        message: "เพิ่มเมนู/ออเดอร์สำเร็จ",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Save Orders Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}