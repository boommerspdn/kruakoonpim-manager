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
import { ListOrdered, Loader2, Save, Utensils } from "lucide-react";
import toast from "react-hot-toast";
import useSWR, { Fetcher } from "swr";
import Loading from "./components/loading";
import MenuRow from "./components/menu-row";
import OrderRow from "./components/order-row";

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
      <form onSubmit={handleSubmit(onSubmit)}>
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
        <section className="space-y-4 px-2">
          <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
            <ListOrdered className="h-5 w-5 text-primary" />
            สรุปรายการสั่งอาหาร
          </h2>
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden px-4 grid gap-4">
            {orderFields.map((field, index) => {
              return (
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
              );
            })}
          </div>
        </section>
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
