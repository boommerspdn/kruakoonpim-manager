import { PreviewMenu, PreviewOrder } from "@/app/(protected)/preview/_page";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body = await req.json();
    const menus: PreviewMenu[] = body.menus;
    const orders: PreviewOrder[] = body.orders;
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
      const uuid = uuidv4();
      if (!order.finalCustomerId) {
        await prisma.customer.create({
          data: {
            id: uuid,
            name: order.inputName,
            aliases:
              order.customerName !== order.inputName
                ? [order.customerName]
                : undefined,
          },
        });
      } else {
        const customer = await prisma.customer.findUnique({
          where: { id: order.finalCustomerId },
        });

        if (customer && !customer.disableAliases) {
          const shouldPushAlias =
            order.customerName !== order.inputName &&
            !customer.aliases.includes(order.customerName);

          await prisma.customer.update({
            where: { id: order.finalCustomerId },
            data: {
              name: order.inputName,
              aliases: shouldPushAlias
                ? { push: order.customerName }
                : undefined,
            },
          });
        }
      }

      await prisma.order.create({
        data: {
          customerId: order.finalCustomerId ? order.finalCustomerId : uuid,
          delivery: order.delivery,
          note: order.note,
          payment: order.payment,
          status: order.status,
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

    // const findNewCustomer = orders.filter((o) => !o.finalCustomerId);
    // for (const order of findNewCustomer) {
    //   await prisma.customer.create({
    //     include: {
    //       orders: { include: { orderItems: true } },
    //     },
    //     data: {
    //       name: order.inputName.trim(),
    //       aliases:
    //         order.customerName !== order.inputName
    //           ? [order.customerName.trim()]
    //           : undefined,
    //       orders: {
    //         createMany: {
    //           data: findNewCustomer.map((o) => {
    //             return {
    //               delivery: o.delivery,
    //               note: o.note,
    //               payment: o.payment,
    //               status: o.status,
    //               date: new Date(date),
    //               sortOrder: o.sortOrder || 0,
    //               orderItems: o.orderItems.map((item) => {
    //                 const newId = menuIdMap.get(item.menuId.toString()) || "";
    //                 return {
    //                   menuId: newId,
    //                   amount: item.amount || 0,
    //                 };
    //               }),
    //             };
    //           }),
    //         },
    //       },
    //     },
    //   });
    // }

    // await prisma.$transaction(
    //   async (tx: Prisma.TransactionClient) => {
    //     const todayMenu = await tx.menu.findFirst({
    //       where: { date: { gte: start, lte: end } },
    //     });

    //     if (todayMenu) {
    //       await Promise.all([
    //         tx.menu.deleteMany({ where: { date: { gte: start, lte: end } } }),
    //         tx.order.deleteMany({ where: { date: { gte: start, lte: end } } }),
    //       ]);
    //     }

    //     const createdMenus = await Promise.all(
    //       menus.map((m, index: number) =>
    //         tx.menu.create({
    //           data: {
    //             name: m.name,
    //             price: m.price || 0,
    //             date: new Date(date),
    //             amount: m.amount || 0,
    //             sortOrder: index || 0,
    //           },
    //         }),
    //       ),
    //     );

    //     createdMenus.forEach((newMenu, index) => {
    //       menuIdMap.set(menus[index].id.toString(), newMenu.id.toString());
    //     });

    //     await Promise.all(
    //       orders.map(async (order) => {
    //         let currentCustomerId = order.finalCustomerId;

    //         if (!currentCustomerId) {
    //           const newCustomer = await tx.customer.create({
    //             data: {
    //               name: order.inputName.trim(),
    //               aliases: [
    //                 order.customerName !== order.inputName
    //                   ? order.customerName.trim()
    //                   : "",
    //               ],
    //             },
    //           });
    //           currentCustomerId = newCustomer.id;
    //         } else {
    //           if (order.customerName !== order.inputName) {
    //             const cleanAlias = order.customerName.trim();
    //             const findScalar = await tx.customer.findFirst({
    //               where: {
    //                 OR: [
    //                   { name: cleanAlias },
    //                   { aliases: { has: cleanAlias } },
    //                 ],
    //               },
    //               select: { id: true },
    //             });

    //             if (!findScalar) {
    //               await tx.customer.update({
    //                 where: { id: currentCustomerId },
    //                 data: { aliases: { push: order.customerName.trim() } },
    //               });
    //             }
    //           }
    //         }

    //         await tx.order.create({
    //           data: {
    //             customerId: currentCustomerId,
    //             note: order.note || null,
    //             delivery: order.delivery || false,
    //             date: new Date(date),
    //             sortOrder: order.sortOrder || 0,
    //             orderItems: {
    //               create: order.orderItems.map((item) => ({
    //                 menuId: menuIdMap.get(item.menuId.toString()) || "",
    //                 amount: item.amount || 0,
    //               })),
    //             },
    //           },
    //         });
    //       }),
    //     );
    //   },
    //   {
    //     maxWait: 60000,
    //     timeout: 60000,
    //   },
    // );

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
