import { Payment } from "@/app/types/order";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const id = searchParams.get("id");
    if (!id) throw new Error("ID was not included in the params");
    const payment = searchParams.get("payment");
    if (!payment) throw new Error("Payment was not included in the params");

    await prisma.order.update({
      where: {
        id,
      },
      data: {
        payment: payment as Payment,
      },
    });

    return NextResponse.json("Order updated successfully");
  } catch (error) {
    console.log(error);
    new NextResponse(`${error}`);
  }
}
