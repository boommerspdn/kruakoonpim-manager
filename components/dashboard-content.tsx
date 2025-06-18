"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import useSWR from "swr";
import { SectionCards } from "@/components/section-cards";
import { fetcher, getOrderData } from "@/lib/utils";
import { useDateStore } from "@/hooks/use-date";
import { Menu, Order } from "@/app/generated/prisma";
import MenuPrompt from "./menu-promt";
import MenuEdit from "./menu-edit";
import FinancialSection from "./financial-section";
import { DataTable } from "@/app/data-table";

const DashboardContent = () => {
  const { date } = useDateStore();
  const [mounted, setMounted] = useState(false);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

  const swrKey = formattedDate ? `/api/menu?date=${formattedDate}` : null;

  const { data, error, isLoading } = useSWR<Menu[]>(swrKey, fetcher);

  // const {
  //   data: orders,
  //   error: ordersError,
  //   isLoading: orderIsLoading,
  // } = useSWR<Order[]>("order-key", () => getOrderData(date));

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <>Loading...</>;
  }
  const makeupData = [
    {
      id: "7552be95-14c9-462a-93f2-3b3f7727675f",
      name: "puang",
      "ef298c62-c39c-4c06-bac5-2202d7990a51": "1",
      "b251ffca-6beb-414f-9816-e522648e1c9e": "2",
      delivery: false,
      note: "ni",
    },
    {
      id: "3e305ab6-f4db-4ab1-a8d7-a93ced3c80f8",
      name: "aaw",
      "ef298c62-c39c-4c06-bac5-2202d7990a51": "1",
      "b251ffca-6beb-414f-9816-e522648e1c9e": "2",
      delivery: true,
      note: "gg",
    },
  ];

  if (mounted) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
        {data?.length !== 0 && data ? (
          <>
            <FinancialSection />
            <SectionCards data={data} />
            <MenuEdit menu={data} />
            <DataTable menu={data} data={makeupData || []} />
          </>
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
