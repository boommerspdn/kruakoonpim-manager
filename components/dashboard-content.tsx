"use client";
import { DataTable } from "@/app/data-table";
import { useDashboardStore } from "@/app/store/dashboard-store";
import FinancialSection from "@/components/financial-section";
import Loading from "@/components/loading";
import MenuEdit from "@/components/menu-edit";
import MenuPrompt from "@/components/menu-promt";
import { SectionCards } from "@/components/section-cards";
import React from "react";

const DashboardContent = () => {
  const [mounted, setMounted] = React.useState(false);

  // Get data from Zustand store instead of API
  const { menus, orders, financialData, menuSummary } = useDashboardStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Loading />;
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6 size-full">
      {menus?.length !== 0 && menus ? (
        <>
          <FinancialSection data={financialData} />
          <SectionCards data={menuSummary} />
          <div className="flex justify-between gap-4">
            <p className="text-muted-foreground w-full">
              {/* *ถ้าตักเสร็จแล้วอย่าลืมแก้ยอดทั้งหมดให้เท่าจำนวนที่ตักได้ด้วย */}
            </p>
            <MenuEdit menu={menus} />
          </div>
          <DataTable menu={menus} data={orders || []} />
        </>
      ) : (
        <MenuPrompt />
      )}
    </div>
  );
};

export default DashboardContent;
