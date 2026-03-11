import { CreateOrder, PatchOrderItem } from "@/app/types/order";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

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
      include: {
        customer: {
          select: {
            name: true,
          },
        },
        orderItems: {
          include: {
            menu: true,
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const ordersWithTotal = orders.map((order) => {
      const itemTotals = order.orderItems.map(
        (item) => item.amount * item.menu.price,
      );

      const totalPrice = itemTotals.reduce((sum, val) => sum + val, 0);

      const { customer, ...restOfOrder } = order;

      return {
        ...restOfOrder,
        customerName: customer?.name || "ไม่มีชื่อ",
        totalPrice,
      };
    });

    return NextResponse.json(ordersWithTotal);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body: PatchOrderItem = await req.json();
    const { id, customerName, delivery, note, payment, status, orderItems } =
      body;

    if (!id) throw new Error("ID was not included in the params");

    const toCreate = orderItems?.toCreate.map((orderItem) => ({
      menuId: orderItem.menuId,
      amount: orderItem.amount,
    }));
    await prisma.order.update({
      where: {
        id,
      },
      data: {
        customer: customerName
          ? {
              connectOrCreate: {
                where: { name: customerName },
                create: { name: customerName },
              },
            }
          : customerName === null
            ? { disconnect: true }
            : undefined,
        delivery,
        note,
        payment,
        status,
        orderItems: {
          createMany: {
            data: toCreate || [],
          },
        },
      },
    });

    for (const updateItem of orderItems.toUpdate) {
      await prisma.orderItem.update({
        where: { id: updateItem.id },
        data: {
          amount: updateItem.changes.amount,
        },
      });
    }

    await prisma.orderItem.deleteMany({
      where: {
        id: { in: orderItems.toDeleteIds },
      },
    });

    return NextResponse.json(`Order editted succesfully`);
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: CreateOrder = await req.json();
    const { customerName, delivery, note, payment, status, orderItems } = body;

    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    if (!body) throw new Error("Body was not included");

    const { start, end } = getDayRange(new Date(date));

    const lastSortOrder =
      (await prisma.order.aggregate({
        _max: { sortOrder: true },
        where: {
          date: {
            gte: start,
            lte: end,
          },
        },
      })) || 0;

    const maxSortOrder =
      lastSortOrder._max.sortOrder !== null
        ? lastSortOrder._max.sortOrder + 1
        : 0;

    const filterZero = orderItems.filter(
      (orderItem) => orderItem.amount !== undefined && orderItem.amount !== 0,
    );

    const formattedOrder = filterZero.map((orderItem) => {
      return {
        menuId: orderItem.menuId,
        amount: orderItem.amount || 0,
      };
    });

    await prisma.order.create({
      data: {
        customer: customerName
          ? {
              connectOrCreate: {
                where: { name: customerName },
                create: { name: customerName },
              },
            }
          : undefined,
        delivery: delivery || false,
        note,
        payment,
        status,
        date: new Date(date),
        sortOrder: maxSortOrder,
        orderItems: {
          createMany: {
            data: formattedOrder,
          },
        },
      },
    });

    return NextResponse.json("Order created successfully");
  } catch (error) {
    return new NextResponse(`${error}`);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return new NextResponse("Id was not included in the params", {
        status: 400,
      });
    }

    await prisma.order.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json(`Deleted rows indexed of ${id}`);
  } catch (error) {
    console.log(error);
    return new NextResponse("Internal error", { status: 500 });
  }
}
