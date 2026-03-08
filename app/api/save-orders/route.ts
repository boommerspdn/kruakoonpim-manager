// app/api/save-orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ปรับ path ให้ตรงกับไฟล์ prisma client ของคุณ
import { Prisma } from "@/app/generated/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { menus, orders } = body;
    const searchParams = req.nextUrl.searchParams;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");

    const result = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const menuIdMap = new Map<string, string>();

        for (const [index, m] of menus.entries()) {
          let dbMenu = await tx.menu.findFirst({
            where: { name: m.name },
          });

          if (!dbMenu) {
            dbMenu = await tx.menu.create({
              data: {
                name: m.name,
                price: m.price || 0,
                date: new Date(date),
                amount: m.amount || 0,
                sortOrder: index || 0,
              },
            });
          }
          menuIdMap.set(m.id.toString(), dbMenu.id);
        }

        for (const [index, order] of orders.entries()) {
          let customerId = order.finalCustomerId;

          if (!customerId) {
            const newCustomer = await tx.customer.create({
              data: {
                name: order.inputName.trim(),
                aliases: [order.customerName.trim()],
              },
            });
            customerId = newCustomer.id;
          }

          await tx.order.create({
            data: {
              customerId: customerId,
              note: order.note || null,
              delivery: !!order.delivery,
              date: new Date(date),
              sortOrder: index || 0,
              orderItems: {
                create: order.orderItems.map((item: any) => ({
                  menuId: menuIdMap.get(item.menuId.toString()),
                  amount: item.amount || 1,
                })),
              },
            },
          });
        }

        return true;
      },
    );

    return NextResponse.json({ success: true, message: "Saved successfully" });
  } catch (error: any) {
    console.error("Save Orders Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดที่ Database: " + error.message,
      },
      { status: 500 },
    );
  }
}
