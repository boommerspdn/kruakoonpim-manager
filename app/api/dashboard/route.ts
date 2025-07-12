import {
  publicDashboard,
  MenuSummary,
  PaymentStatus,
} from "@/app/types/dashboard";
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
      select: {
        id: true,
        customerName: true,
        date: true,
        note: true,
        payment: true,
        status: true,
        orderItems: {
          select: {
            menuId: true,
            amount: true,
            menu: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
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
    //Finalcial
    const totalOfAllOrders = ordersWithTotal.reduce(
      (sum, val) => sum + val.totalPrice,
      0,
    );

    const totalOfCashPaid = ordersWithTotal
      .filter((order) => order.payment === "CASH")
      .reduce((sum, val) => sum + val.totalPrice, 0);

    const totalOfOnlinePaid = ordersWithTotal
      .filter((order) => order.payment === "ONLINE")
      .reduce((sum, val) => sum + val.totalPrice, 0);

    const totalOfUnknownPaid = ordersWithTotal
      .filter((order) => order.payment === "UNKNOWN")
      .reduce((sum, val) => sum + val.totalPrice, 0);

    const financial: PaymentStatus = {
      total: totalOfAllOrders,
      cash: totalOfCashPaid,
      online: totalOfOnlinePaid,
      unknown: totalOfUnknownPaid,
    };
    //Finalcial

    //MenuSummary
    const menus = await prisma.menu.findMany({
      where: {
        date: {
          gte: start,
          lte: end,
        },
      },
      select: {
        id: true,
        name: true,
        price: true,
        amount: true,
        orderItems: {
          select: {
            id: true,
            menuId: true,
            orderId: true,
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    const menuSummary: MenuSummary[] = await Promise.all(
      menus.map(async (menu) => {
        const unpicked = await prisma.orderItem.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            menuId: menu.id,
            order: {
              status: "PENDING",
              date: {
                gte: start,
                lte: end,
              },
            },
          },
        });

        const ordered = await prisma.orderItem.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            menuId: menu.id,
            order: {
              date: {
                gte: start,
                lte: end,
              },
            },
          },
        });

        const picked = await prisma.orderItem.aggregate({
          _sum: { amount: true },
          where: {
            menuId: menu.id,
            order: {
              status: "COMPLETED",
              date: {
                gte: start,
                lte: end,
              },
            },
          },
        });

        return {
          id: menu.id,
          name: menu.name,
          price: menu.price,
          menuData: {
            unpicked: unpicked._sum.amount || 0,
            total: menu.amount,
            ordered: ordered._sum.amount || 0,
            sellable: menu.amount - (ordered._sum.amount || 0),
            picked: picked._sum.amount || 0,
            require: menu.amount - (picked._sum.amount || 0),
            special: orders.filter((order) => order.note).length,
          },
        };
      }),
    );

    const dashboardData: publicDashboard = {
      financial,
      menuSummary,
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.log(error);
    return new NextResponse(`${error}`);
  }
}
