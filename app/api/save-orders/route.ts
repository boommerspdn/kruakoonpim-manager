import { Prisma } from "@/app/generated/prisma";
import { SaveOrdersRequest, SaveOrder, CustomerLookup, MenuMapping, ProcessedOrderData } from "@/app/types/save-orders";
import prisma from "@/lib/prisma";
import { getDayRange } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const body: SaveOrdersRequest = await req.json();
    const { menus, orders } = body;
    const date = searchParams.get("date");

    if (!date) throw new Error("Date was not included in the params");
    const { start, end } = getDayRange(new Date(date));

    // Step 1: Check if today's menu exists and delete if needed (outside transaction)
    const todayMenu = await prisma.menu.findFirst({
      where: { date: { gte: start, lte: end } },
    });

    if (todayMenu) {
      await Promise.all([
        prisma.menu.deleteMany({ where: { date: { gte: start, lte: end } } }),
        prisma.order.deleteMany({ where: { date: { gte: start, lte: end } } }),
      ]);
    }

    // Step 2: Process customer data outside transaction
    const customerData = await processCustomerData(orders);

    // Step 3: Create menus and get mapping
    const menuIdMap = await createMenusAndGetMapping(menus, new Date(date));

    // Step 4: Process orders with pre-computed data
    const processedOrders = prepareOrderData(orders, customerData, menuIdMap);

    // Step 5: Execute database operations in a single transaction
    await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // Create customers that don't exist
        const newCustomers = customerData.filter(c => c.isNew);
        const createdCustomerIds = new Map<string, string>();
        
        if (newCustomers.length > 0) {
          const created = await tx.customer.createMany({
            data: newCustomers.map(c => ({
              name: c.name,
              aliases: c.aliases,
            })),
            skipDuplicates: true,
          });
          
          // Fetch the newly created customers to get their IDs
          const newlyCreated = await tx.customer.findMany({
            where: {
              name: { in: newCustomers.map(c => c.name) },
            },
          });
          
          newlyCreated.forEach(customer => {
            createdCustomerIds.set(customer.name, customer.id);
          });
        }

        // Update existing customers with new aliases
        const customersWithNewAliases = customerData.filter(c => !c.isNew && c.newAliases.length > 0);
        if (customersWithNewAliases.length > 0) {
          await Promise.all(
            customersWithNewAliases.map(c =>
              tx.customer.update({
                where: { id: c.id },
                data: { aliases: { push: c.newAliases[0] } },
              })
            )
          );
        }

        // Create all orders with resolved customer IDs
        await Promise.all(
          processedOrders.map(({ order, customerId, menuIdMap }) => {
            let finalCustomerId = customerId;
            
            // If this customer doesn't have a UUID format, it's a new customer name
            // Resolve it from the newly created customers
            if (!customerId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)) {
              finalCustomerId = createdCustomerIds.get(customerId) || customerId;
            }
            
            return tx.order.create({
              data: {
                customerId: finalCustomerId,
                note: order.note || null,
                delivery: order.delivery || false,
                date: new Date(date),
                sortOrder: order.sortOrder || 0,
                orderItems: {
                  create: order.orderItems.map((item) => ({
                    menuId: menuIdMap.get(item.menuId) || "",
                    amount: item.amount || 0,
                  })),
                },
              },
            });
          })
        );
      },
      {
        maxWait: 60000,
        timeout: 60000,
      },
    );

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

// Helper function to process customer data outside transaction
async function processCustomerData(orders: SaveOrder[]) {
  // Extract unique customer names and input names
  const uniqueNames = new Set<string>();
  const customerNameToInputName = new Map<string, string>();
  
  orders.forEach(order => {
    if (!order.finalCustomerId) {
      uniqueNames.add(order.inputName.trim());
      customerNameToInputName.set(order.customerName.trim(), order.inputName.trim());
    }
  });

  // Batch fetch existing customers
  const existingCustomers = await prisma.customer.findMany({
    where: {
      OR: [
        { name: { in: Array.from(uniqueNames) } },
        { aliases: { hasSome: Array.from(uniqueNames) } },
      ],
    },
  });

  // Create customer lookup map
  const customerMap = new Map<string, CustomerLookup>();
  existingCustomers.forEach(customer => {
    customerMap.set(customer.name, customer);
    customer.aliases.forEach(alias => {
      customerMap.set(alias, customer);
    });
  });

  // Process each order's customer data
  const processedCustomers = new Map<string, {
    id?: string;
    name: string;
    aliases: string[];
    isNew: boolean;
    newAliases: string[];
  }>();

  orders.forEach(order => {
    const inputName = order.inputName.trim();
    const customerName = order.customerName.trim();
    
    if (order.finalCustomerId) {
      // Existing customer - check if we need to add alias
      const existingCustomer = existingCustomers.find(c => c.id === order.finalCustomerId);
      if (existingCustomer && !existingCustomer.aliases.includes(customerName) && customerName !== existingCustomer.name) {
        processedCustomers.set(order.finalCustomerId, {
          id: order.finalCustomerId,
          name: existingCustomer.name,
          aliases: existingCustomer.aliases,
          isNew: false,
          newAliases: [customerName],
        });
      }
    } else {
      // New customer or existing by name/alias
      const existing = customerMap.get(inputName);
      if (!existing) {
        processedCustomers.set(inputName, {
          name: inputName,
          aliases: [customerName],
          isNew: true,
          newAliases: [],
        });
      }
    }
  });

  return Array.from(processedCustomers.values());
}

// Helper function to create menus and return ID mapping
async function createMenusAndGetMapping(menus: SaveOrdersRequest['menus'], date: Date): Promise<Map<string, string>> {
  const createdMenus = await Promise.all(
    menus.map((m, index) =>
      prisma.menu.create({
        data: {
          name: m.name,
          price: m.price || 0,
          date,
          amount: m.amount || 0,
          sortOrder: index || 0,
        },
      }),
    ),
  );

  const menuIdMap = new Map<string, string>();
  createdMenus.forEach((newMenu, index) => {
    menuIdMap.set(menus[index].id, newMenu.id);
  });

  return menuIdMap;
}

// Helper function to prepare order data with resolved customer IDs
function prepareOrderData(
  orders: SaveOrder[], 
  customerData: ReturnType<typeof processCustomerData> extends Promise<infer T> ? T : never,
  menuIdMap: Map<string, string>
): ProcessedOrderData[] {
  // Create customer lookup for easy access
  const customerLookup = new Map<string, string>();
  customerData.forEach(c => {
    if (c.id) {
      customerLookup.set(c.id, c.id);
    }
  });

  return orders.map(order => {
    let customerId: string;
    
    if (order.finalCustomerId) {
      customerId = order.finalCustomerId;
    } else {
      // For new customers, use the input name as a temporary identifier
      customerId = order.inputName.trim();
    }

    return {
      order,
      customerId,
      menuIdMap,
    };
  });
}
