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
      orderItems: true
    }
  }>
  const { date } = useDateStore();
  const [mounted, setMounted] = useState(false);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

  const swrKey = formattedDate ? `/api/menu?date=${formattedDate}` : null;

  const { data, error, isLoading } = useSWR<Menu[]>(swrKey, fetcher);

  const {
    data: orders,
    error: ordersError,
    isLoading: orderIsLoading,
  } = useSWR<OrderWithItems[]>(["order-key", swrKey], () => getOrderData(date));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || orderIsLoading) {
    return <>Loading...</>;
  }

  const formatOrders: TableRowData[] | undefined = orders?.map((order) => {
  const items = Object.assign({}, ...order.orderItems.map(item => ({ [item.menuId]: item.amount })));

    return {
      id: order.id,
      name: order.customerName,
      note: order.note || "",
      delivery: order.delivery,
      ...items
    }
  })
  const makeupData: TableRowData[] = [
    {
      id: "7552be95-14c9-462a-93f2-3b3f7727675f",
      name: "puang",
      "a82d2d41-4e31-4806-8928-79085c9c264f": 2,
      "90cb9f4e-1b7c-4517-9beb-947bd9b50414": 2,
      "e2478ceb-1d5a-48ab-9b6c-2b65928b921d": 2,
      "66a827d6-0736-4fa6-8346-7c6188d42648": 2,
      "3d21d712-0ed7-4a22-af9f-a2a0e7c54e27": 2,
      "22547897-a284-490c-be64-1cf7594cc848": 2,
      delivery: false,
      note: "ni",
    },
    {
      id: "3e305ab6-f4db-4ab1-a8d7-a93ced3c80f8",
      name: "aaw",
      "a82d2d41-4e31-4806-8928-79085c9c264f": 2,
      "90cb9f4e-1b7c-4517-9beb-947bd9b50414": 2,
      "e2478ceb-1d5a-48ab-9b6c-2b65928b921d": 2,
      "66a827d6-0736-4fa6-8346-7c6188d42648": 2,
      "3d21d712-0ed7-4a22-af9f-a2a0e7c54e27": 2,
      "22547897-a284-490c-be64-1cf7594cc848": 2,
      delivery: true,
      note: "gg",
    },
    {
      id: "2e305ab6-f4db-4ab1-a8d7-a93ced3c80f2",
      name: "tiw",
      "a82d2d41-4e31-4806-8928-79085c9c264f": 2,
      "90cb9f4e-1b7c-4517-9beb-947bd9b50414": 2,
      "e2478ceb-1d5a-48ab-9b6c-2b65928b921d": 2,
      "66a827d6-0736-4fa6-8346-7c6188d42648": 2,
      "3d21d712-0ed7-4a22-af9f-a2a0e7c54e27": 2,
      "22547897-a284-490c-be64-1cf7594cc848": 2,
      delivery: true,
      note: null,
    },
  ];

  if (mounted) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
<button onClick={() => console.log(formatOrders)}>test</button>
        {data?.length !== 0 && data ? (
          <>
            <FinancialSection />
            <SectionCards data={data} />
            <MenuEdit menu={data} />
            <DataTable menu={data} data={formatOrders||[]} />
          </>
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
