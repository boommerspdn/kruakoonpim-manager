import { CustomerFormValues } from "@/app/types/customer";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Customer ID is required" },
        { status: 400 },
      );
    }

    await prisma.customer.delete({
      where: { id },
    });

    return NextResponse.json(
      { success: true, message: "Customer deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("DELETE Customer Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to delete customer",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body: CustomerFormValues = await req.json();

    const { name, aliases } = body;

    const updatedCustomer = await prisma.customer.update({
      where: { id },
      data: {
        name: name || undefined,
        aliases: aliases || undefined,
      },
    });

    return NextResponse.json(
      { success: true, data: updatedCustomer },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH Customer Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to update customer",
      },
      { status: 500 },
    );
  }
}
