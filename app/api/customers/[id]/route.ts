import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    await prisma.customer.delete({
      where: { id: id },
    });

    return NextResponse.json(
      { success: true, message: "Customer deleted successfully" },
      { status: 200 },
    );
  } catch (error: any) {
    if (error.code === "P2025") {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 },
      );
    }

    console.error("DELETE Customer Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete customer" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = params.id;
    const body = await req.json();

    const { name, aliases } = body;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(aliases && { aliases }),
      },
    });

    return NextResponse.json(
      { success: true, data: updatedCustomer },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to update" },
      { status: 500 },
    );
  }
}
