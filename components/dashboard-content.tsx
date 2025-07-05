"use client";
import React from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { DataTable } from "@/app/data-table";
import { publicDashboard } from "@/app/types/dashboard";
import { PublicMenu } from "@/app/types/menu";
import { PublicOrder } from "@/app/types/order";
import FinancialSection from "@/components/financial-section";
import Loading from "@/components/loading";
import MenuEdit from "@/components/menu-edit";
import MenuPrompt from "@/components/menu-promt";
import { SectionCards } from "@/components/section-cards";
import { useDateStore } from "@/hooks/use-date";
import { fetcher } from "@/lib/utils";

const DashboardContent = () => {
  const { date } = useDateStore();
  const [mounted, setMounted] = React.useState(false);

  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useSWR<PublicMenu[]>(
    `/api/menu?date=${formattedDate}`,
    fetcher,
  );

  const { data: orders, isLoading: orderIsLoading } = useSWR<PublicOrder[]>(
    `/api/order?date=${formattedDate}`,
    fetcher,
  );

  const { data: dashboardData, isLoading: dashboardIsLoading } =
    useSWR<publicDashboard>(`/api/dashboard?date=${formattedDate}`, fetcher);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || orderIsLoading || dashboardIsLoading) {
    return <Loading />;
  }

  if (mounted || !isLoading || !orderIsLoading || !dashboardIsLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
        {data?.length !== 0 && data && dashboardData ? (
          <>
            <FinancialSection data={dashboardData?.financial} />
            <SectionCards data={dashboardData?.menuSummary} />
            <div className="flex justify-between">
              <p className="text-muted-foreground w-full">
                *ถ้าตักเสร็จแล้วอย่าลืมแก้ยอดทั้งหมดให้เท่าจำนวนที่ตักได้ด้วย
              </p>
              <MenuEdit menu={data} />
            </div>
            <DataTable menu={data} data={orders || []} />
          </>
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
