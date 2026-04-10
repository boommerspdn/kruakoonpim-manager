"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";

import { Customer } from "@/app/types/customer";
import { StoreMenu, storeMenuSchema } from "@/app/types/menu";
import { StoreOrder, storeOrderSchema } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDateStore } from "@/hooks/use-date";
import { matchAiNamesWithCustomers } from "@/lib/fuzzy-match";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import { BarChart, FileText, ListOrdered, Loader2, Save, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import useSWR, { Fetcher } from "swr";
import Loading from "./components/loading";
import MenuRow from "./components/menu-row";
import OrderRow from "./components/order-row";
import { getMenuOrderSummary } from "@/lib/utils";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

const PreviewPage = () => {
  const router = useRouter();
  const [initialData, setInitialData] = useState<StoreMenuOrder>({
    menus: [],
    orders: [],
  });
  const [isLoading, setIsloading] = useState(true);
  const fetcher: Fetcher<Customer[], string> = (url) =>
    axios.get(url).then((res) => res.data.data);
  const { data: customers } = useSWR("/api/customers", fetcher);
  const { date } = useDateStore();
  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const saved = sessionStorage.getItem("geminiPreviewData");
    if (saved) {
      try {
        setInitialData(JSON.parse(saved));

        setTimeout(() => setIsloading(false), 100);
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
  }, []);

  useEffect(() => {
    const savedData = sessionStorage.getItem("geminiPreviewData");
    if (!savedData) {
      router.push("/");
      return;
    }
  }, [router]);

  const formSchema = z.object({
    menus: z.array(storeMenuSchema),
    orders: z.array(storeOrderSchema),
  });

  const { setValue, handleSubmit, control, register, formState } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    values: initialData,
    resetOptions: {
      keepDirtyValues: true,
    },
  });

  const { fields: menuFields } = useFieldArray({ control, name: "menus" });
  const { fields: orderFields } = useFieldArray({ control, name: "orders" });

  const aiDetectedNames = useMemo(() => {
    return initialData.orders.map((o) => o.customerName);
  }, [initialData.orders]);
  const similarNamesMap = useMemo(() => {
    return matchAiNamesWithCustomers(customers || [], aiDetectedNames);
  }, [customers, aiDetectedNames]);

  const ordersByPage = useMemo(() => {
    const grouped = new Map<number, { field: typeof orderFields[number]; index: number }[]>();
    orderFields.forEach((field, index) => {
      const page = field.pageNumber ?? 1;
      if (!grouped.has(page)) grouped.set(page, []);
      grouped.get(page)!.push({ field, index });
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [orderFields]);

  const pageSummaries = useMemo(() => {
    const map = new Map<number, ReturnType<typeof getMenuOrderSummary>>();
    for (const [pageNumber, pageOrders] of ordersByPage) {
      const pageOrderData = pageOrders.map(({ field }) => field);
      map.set(pageNumber, getMenuOrderSummary({ menus: initialData.menus, orders: pageOrderData }));
    }
    return map;
  }, [ordersByPage, initialData.menus]);

  const totalSummary = useMemo(() => {
    return getMenuOrderSummary(initialData);
  }, [initialData]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    const hasEmptyName = data.orders.some((o) => !o.inputName?.trim());

    if (hasEmptyName) {
      toast.error("กรุณาระบุชื่อลูกค้าให้ออเดอร์ครบทุกช่อง");
      return;
    }

    const toastId = toast.loading("กำลังบันทึกข้อมูล...");

    try {
      console.log(data);
      const response = await fetch(`/api/save-orders?date=${formattedDate}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      toast.success("บันทึกข้อมูลเรียบร้อย!", {
        id: toastId,
      });

      // sessionStorage.removeItem("geminiPreviewData");
      router.push("/");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
          }
        }}
      >
        <section className="space-y-4 px-2">
          <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
            <Utensils className="h-5 w-5 text-primary" />
            สรุปรายการเมนู
          </h2>
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="border-b">
                <tr>
                  <th className="p-4 w-[40%]">ชื่อเมนู</th>
                  <th className="p-4 w-[25%]">ราคา</th>
                  <th className="p-4 w-[25%]">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {menuFields.map((field, index) => (
                  <MenuRow
                    key={field.id}
                    field={field}
                    index={index}
                    register={register}
                  />
                ))}
                {menuFields.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-8 text-center text-muted-foreground"
                    >
                      ไม่พบข้อมูลเมนูจากภาพ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {ordersByPage.map(([pageNumber, pageOrders]) => {
          const summary = pageSummaries.get(pageNumber) ?? [];
          return (
            <section key={pageNumber} className="space-y-4 px-2 mt-6">
              <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
                <FileText className="h-5 w-5 text-primary" />
                หน้า {pageNumber}
                <span className="text-sm font-normal text-muted-foreground">
                  ({pageOrders.length} ออเดอร์)
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
                {summary.map((menu, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between p-3 rounded-lg border bg-white shadow-sm"
                  >
                    <span className="text-sm font-medium text-muted-foreground line-clamp-2">
                      {menu.name}
                    </span>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold text-primary">
                        {menu.totalOrdered}
                      </span>
                      <span className="text-xs text-muted-foreground font-normal">
                        รายการ
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-lg border shadow-sm overflow-hidden px-4 grid gap-4">
                {pageOrders.map(({ field, index }) => (
                  <div key={field.id}>
                    <OrderRow
                      control={control}
                      customers={customers?.map((c) => c.name) || []}
                      index={index}
                      field={field}
                      setValue={setValue}
                      register={register}
                      siimilarNames={
                        similarNamesMap.get(field.customerName) || null
                      }
                    />
                    <Separator />
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {orderFields.length > 0 && ordersByPage.length > 1 && (
          <section className="space-y-4 px-2 mt-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
              <BarChart className="h-5 w-5 text-primary" />
              สรุปรวมทุกหน้า
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
              {totalSummary.map((menu, idx) => (
                <div
                  key={idx}
                  className="flex flex-col justify-between p-4 rounded-lg border bg-white shadow-sm hover:border-primary/50 transition-colors"
                >
                  <span className="text-sm font-medium text-muted-foreground line-clamp-2">
                    {menu.name}
                  </span>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold text-primary">
                      {menu.totalOrdered}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      รายการ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {orderFields.length === 0 && (
          <section className="space-y-4 px-2 mt-6">
            <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
              <ListOrdered className="h-5 w-5 text-primary" />
              สรุปรายการสั่งอาหาร
            </h2>
            <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg bg-slate-50 mx-2">
              ไม่พบรายการสั่งอาหารจากภาพ
            </div>
          </section>
        )}

        <div className="flex justify-end py-6 px-2">
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            บันทึกข้อมูล
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PreviewPage;
