import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(
      { success: true, data: customers },
      { status: 200 },
    );
  } catch (error) {
    console.error("GET Customer Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch customers" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, aliases = [] } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Customer name is required" },
        { status: 400 },
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name: name.trim(),
        aliases: aliases,
      },
    });

    return NextResponse.json(
      { success: true, data: newCustomer },
      { status: 201 },
    );
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "มีชื่อลูกค้านี้ในระบบแล้ว" },
        { status: 409 },
      );
    }

    console.error("POST Customer Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create customer" },
      { status: 500 },
    );
  }
}
