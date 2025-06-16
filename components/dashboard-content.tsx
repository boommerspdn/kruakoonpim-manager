"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import useSWR from "swr";
import { SectionCards } from "@/components/section-cards";
import { fetcher } from "@/lib/utils";
import { useDateStore } from "@/hooks/use-date";
import { Menu } from "@/app/generated/prisma";
import MenuPrompt from "./menu-promt";
import MenuEdit from "./menu-edit";
import FinancialSection from "./financial-section";
import { DataTable } from "@/app/data-table";

const DashboardContent = () => {
  const { date } = useDateStore();
  const [mounted, setMounted] = useState(false);

  const formattedDate = date ? format(date, "yyyy-MM-dd") : null;

  const swrKey = formattedDate ? `/api/menu?date=${formattedDate}` : null;

  const { data, error, isLoading } = useSWR<Menu[]>(swrKey, fetcher, {
    fallbackData: [],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return <>Loading...</>;
  }

  if (mounted) {
    return (
      <div className="flex flex-col gap-4 md:gap-6 size-full">
        {data?.length !== 0 && data ? (
          <>
            <FinancialSection />
            <SectionCards data={data} />
            <MenuEdit menu={data} />
            <DataTable
              data={[{ id: 2, name: "2323", asdasdasd: "first" }]}
              menu={data}
            />
          </>
        ) : (
          <MenuPrompt />
        )}
      </div>
    );
  }
};

export default DashboardContent;
