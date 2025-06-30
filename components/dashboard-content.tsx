"use client";
import { DashboardData } from "@/app/api/dashboard/route";
import { DataTable } from "@/app/data-table";
import { Menu, Prisma } from "@/app/generated/prisma";
import { SectionCards } from "@/components/section-cards";
import { useDateStore } from "@/hooks/use-date";
import { fetcher } from "@/lib/utils";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import useSWR from "swr";
import FinancialSection from "./financial-section";
import Loading from "./loading";
import MenuEdit from "./menu-edit";
import MenuPrompt from "./menu-promt";

export type TableRowData = {
  id: string;
  name: string;
  delivery: boolean;
  note: string | null;
  [x: string]: string | number | boolean | null;
};

const DashboardContent = () => {
  type OrderWithItems = Prisma.OrderGetPayload<{
    include: {
      orderItems: true;
    };
  }> & { totalPrice: number };

  const { date } = useDateStore();
  const [mounted, setMounted] = useState(false);

  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useSWR<Menu[]>(
    `/api/menu?date=${formattedDate}`,
    fetcher,
  );

  const { data: orders, isLoading: orderIsLoading } = useSWR<OrderWithItems[]>(
    `/api/order?date=${formattedDate}`,
    fetcher,
  );

  const { data: dashboardData, isLoading: dashboardIsLoading } =
    useSWR<DashboardData>(`/api/dashboard?date=${formattedDate}`, fetcher);
  console.log(dashboardData);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || orderIsLoading || dashboardIsLoading) {
    return <Loading />;
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
            <FinancialSection data={dashboardData?.financial} />
            <SectionCards data={dashboardData?.menuSummary} />
            <div className="flex justify-between">
              <p className="text-muted-foreground w-full">
                *ถ้าตักเสร็จแล้วอย่าลืมแก้ยอดทั้งหมดให้เท่าจำนวนที่ตักได้ด้วย
              </p>
              <MenuEdit menu={data} />
            </div>
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
