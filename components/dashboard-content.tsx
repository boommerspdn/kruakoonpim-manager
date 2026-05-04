"use client";
import React from "react";
import useSWR from "swr";
import { DataTable } from "@/app/data-table";
import { publicDashboard } from "@/app/types/dashboard";
import { PublicMenu } from "@/app/types/menu";
import { ChangeCalculatorModal } from "@/components/modals/change-calculator-modal";
import FinancialSection from "@/components/financial-section";
import Loading from "@/components/loading";
import MenuEdit from "@/components/menu-edit";
import MenuPrompt from "@/components/menu-promt";
import { SectionCards } from "@/components/section-cards";
import { useDateStore } from "@/hooks/use-date";
import { fetcher } from "@/lib/utils";
import { swrKeys } from "@/lib/swr-keys";

const DashboardContent = () => {
  const { date } = useDateStore();
  const [mounted, setMounted] = React.useState(false);

  const { data, isLoading, isValidating } = useSWR<PublicMenu[]>(swrKeys.menu(date), fetcher);

  const { data: dashboardData, isLoading: dashboardIsLoading, isValidating: dashboardIsValidating } =
    useSWR<publicDashboard>(swrKeys.dashboard(date), fetcher);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading || dashboardIsLoading) {
    return <Loading />;
  }

  if (mounted || !isLoading || !dashboardIsLoading) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
        <ChangeCalculatorModal />
        {data?.length !== 0 && data && dashboardData ? (
          <>
            <FinancialSection data={dashboardData?.financial} />
            <SectionCards data={dashboardData?.menuSummary} />
            <div className="flex justify-between gap-4">
              <p className="text-muted-foreground w-full">
                *ถ้าตักเสร็จแล้วอย่าลืมแก้ยอดทั้งหมดให้เท่าจำนวนที่ตักได้ด้วย
              </p>
              <MenuEdit menu={data} />
            </div>
            <DataTable menu={data} />
          </>
        ) : isValidating || dashboardIsValidating ? (
          <Loading />
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
