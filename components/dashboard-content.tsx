"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import useSWR from "swr";
import { SectionCards } from "@/components/section-cards";
import { fetcher, getOrderData } from "@/lib/utils";
import { useDateStore } from "@/hooks/use-date";
import { Menu, Order, Prisma, PrismaClient } from "@/app/generated/prisma";
import MenuPrompt from "./menu-promt";
import MenuEdit from "./menu-edit";
import FinancialSection from "./financial-section";
import { DataTable } from "@/app/data-table";
import { useSWRConfig } from "swr";

export type TableRowData = {
  id: string;
  name: string;
  delivery: boolean;
  note: string | null;
  [x: string]: string | number | boolean | null;
};

const DashboardContent = () => {
  const prisma = new PrismaClient();

  type OrderWithItems = Prisma.OrderGetPayload<{
    include: {
      orderItems: true;
    };
  }> & { totalPrice: number };

  const { date } = useDateStore();
  const [mounted, setMounted] = useState(false);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

  const swrKey = formattedDate ? `/api/menu?date=${formattedDate}` : null;

  const { data, error, isLoading } = useSWR<Menu[]>(swrKey, fetcher);

  const { mutate } = useSWRConfig();

  const {
    data: orders,
    error: ordersError,
    isLoading: orderIsLoading,
  } = useSWR<OrderWithItems[]>(date, getOrderData);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || orderIsLoading) {
    return <>Loading...</>;
  }

  const formatOrders: TableRowData[] | undefined = orders?.map((order) => {
    const items = Object.assign(
      {},
      ...order.orderItems.map((item) => ({ [item.menuId]: item.amount })),
    );

    return {
      id: order.id,
      name: order.customerName,
      note: order.note || "",
      delivery: order.delivery,
      status: order.status,
      payment: order.payment,
      totalPrice: order.totalPrice,
      ...items,
    };
  });

  if (mounted) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
        {data?.length !== 0 && data ? (
          <>
            <FinancialSection />
            <SectionCards data={data} />
            <MenuEdit menu={data} />
            <DataTable menu={data} data={formatOrders || []} />
          </>
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
