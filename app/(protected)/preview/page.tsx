"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Customer } from "@/app/types/customer";
import { StoreMenu, storeMenuSchema } from "@/app/types/menu";
import { StoreOrder, storeOrderSchema } from "@/app/types/order";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useDateStore } from "@/hooks/use-date";
import { useGeminiStream } from "@/hooks/use-gemini-stream";
import { matchAiNamesWithCustomers } from "@/lib/fuzzy-match";
import { getMenuOrderSummary } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { format } from "date-fns";
import {
  BarChart,
  FileText,
  ListOrdered,
  Loader2,
  Save,
  Utensils,
} from "lucide-react";
import toast from "react-hot-toast";
import useSWR, { Fetcher } from "swr";
import Loading from "./components/loading";
import MenuRow from "./components/menu-row";
import OrderRow from "./components/order-row";

type StoreMenuOrder = {
  menus: StoreMenu[];
  orders: StoreOrder[];
};

const PageLoadingSkeleton = ({ pageNumber }: { pageNumber: number }) => (
  <section className="space-y-4 px-2 mt-6 animate-in fade-in duration-500">
    <h2 className="text-xl font-semibold flex items-center gap-2 px-4 pt-4">
      <FileText className="h-5 w-5 text-primary" />
      หน้า {pageNumber}
      <span className="text-sm font-normal text-muted-foreground">
        (กำลังโหลด...)
      </span>
    </h2>

    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 px-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex flex-col justify-between p-3 rounded-lg border bg-white shadow-sm"
        >
          <Skeleton className="h-4 w-[70%] mb-2" />
          <Skeleton className="h-8 w-[40%]" />
        </div>
      ))}
    </div>

    <div className="bg-white rounded-lg border shadow-sm overflow-hidden px-4 py-6">
      <div className="flex items-center justify-center gap-3 py-4">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">
          กำลังประมวลผลหน้า {pageNumber}...
        </span>
      </div>
      <div className="space-y-4 mt-2">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-4 md:py-4">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-3 pt-2">
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-[60px] w-full rounded-md" />
              </div>
            </div>
            {i !== 2 && <Separator className="mt-2" />}
          </div>
        ))}
      </div>
    </div>
  </section>
);

const PreviewPage = () => {
  const router = useRouter();
  const [sessionData, setSessionData] = useState<StoreMenuOrder | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const {
    menus: streamMenus,
    ordersByPage: streamOrdersByPage,
    totalPages,
    isStreaming,
    firstPageReady,
  } = useGeminiStream();

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
        setSessionData(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse session data", e);
      }
    }
    setSessionLoaded(true);
  }, []);

  const streamPreviewData = useMemo<StoreMenuOrder | null>(() => {
    if (!firstPageReady) return null;
    const allOrders: StoreOrder[] = [];
    for (const pn of Object.keys(streamOrdersByPage)
      .map(Number)
      .sort((a, b) => a - b)) {
      allOrders.push(...streamOrdersByPage[pn]);
    }
    return { menus: streamMenus, orders: allOrders };
  }, [firstPageReady, streamMenus, streamOrdersByPage]);

  const previewData = streamPreviewData ?? sessionData;
  const isPageLoading = !sessionLoaded && !firstPageReady;

  useEffect(() => {
    if (sessionLoaded && !previewData && !firstPageReady && !isStreaming) {
      router.push("/");
    }
  }, [sessionLoaded, previewData, firstPageReady, isStreaming, router]);

  const formSchema = z.object({
    menus: z.array(storeMenuSchema),
    orders: z.array(storeOrderSchema),
  });

  const syncedPagesRef = useRef<Set<number>>(new Set());
  const dataSourceRef = useRef<"none" | "session" | "stream">("none");

  const { setValue, handleSubmit, control, register, formState } = useForm<
    z.infer<typeof formSchema>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: { menus: [], orders: [] },
  });

  const { fields: menuFields, replace: replaceMenus } = useFieldArray({
    control,
    name: "menus",
  });
  const {
    fields: orderFields,
    replace: replaceOrders,
    append: appendOrders,
  } = useFieldArray({ control, name: "orders" });

  useEffect(() => {
    if (!sessionData || firstPageReady || isStreaming) return;
    if (dataSourceRef.current !== "none") return;

    replaceMenus(sessionData.menus);
    replaceOrders(sessionData.orders);
    dataSourceRef.current = "session";
    syncedPagesRef.current = new Set(
      sessionData.orders.map((o) => o.pageNumber ?? 1),
    );
  }, [sessionData, firstPageReady, isStreaming, replaceMenus, replaceOrders]);

  useEffect(() => {
    if (!firstPageReady) return;

    const pageNumbers = Object.keys(streamOrdersByPage)
      .map(Number)
      .sort((a, b) => a - b);

    if (dataSourceRef.current !== "stream") {
      replaceMenus(streamMenus);
      const allOrders = pageNumbers.flatMap((pn) => streamOrdersByPage[pn]);
      replaceOrders(allOrders);
      dataSourceRef.current = "stream";
      syncedPagesRef.current = new Set(pageNumbers);
    } else {
      const newPages = pageNumbers.filter(
        (pn) => !syncedPagesRef.current.has(pn),
      );
      if (newPages.length === 0) return;
      const newOrders = newPages.flatMap((pn) => streamOrdersByPage[pn]);
      appendOrders(newOrders);
      newPages.forEach((pn) => syncedPagesRef.current.add(pn));
    }
  }, [
    firstPageReady,
    streamMenus,
    streamOrdersByPage,
    replaceMenus,
    replaceOrders,
    appendOrders,
  ]);

  const aiDetectedNames = useMemo(() => {
    return (previewData?.orders ?? []).map((o) => o.customerName);
  }, [previewData?.orders]);
  const similarNamesMap = useMemo(() => {
    return matchAiNamesWithCustomers(customers || [], aiDetectedNames);
  }, [customers, aiDetectedNames]);

  const ordersByPage = useMemo(() => {
    const grouped = new Map<
      number,
      { field: (typeof orderFields)[number]; index: number }[]
    >();
    orderFields.forEach((field, index) => {
      const page = field.pageNumber ?? 1;
      if (!grouped.has(page)) grouped.set(page, []);
      grouped.get(page)!.push({ field, index });
    });
    return Array.from(grouped.entries()).sort(([a], [b]) => a - b);
  }, [orderFields]);

  const loadedPageNumbers = useMemo(
    () => new Set(ordersByPage.map(([pn]) => pn)),
    [ordersByPage],
  );

  const pendingPageNumbers = useMemo(() => {
    if (!isStreaming || totalPages <= 1) return [];
    return Array.from({ length: totalPages }, (_, i) => i + 1).filter(
      (pn) => !loadedPageNumbers.has(pn),
    );
  }, [isStreaming, totalPages, loadedPageNumbers]);

  const allPageNumbers = useMemo(() => {
    const pages = new Set([
      ...ordersByPage.map(([pn]) => pn),
      ...pendingPageNumbers,
    ]);
    return Array.from(pages).sort((a, b) => a - b);
  }, [ordersByPage, pendingPageNumbers]);

  const watchedMenus = useWatch({ control, name: "menus" });
  const watchedOrders = useWatch({ control, name: "orders" });

  const pageSummaries = useMemo(() => {
    const map = new Map<number, ReturnType<typeof getMenuOrderSummary>>();
    const grouped = new Map<number, StoreOrder[]>();
    (watchedOrders ?? []).forEach((order) => {
      const page = order.pageNumber ?? 1;
      if (!grouped.has(page)) grouped.set(page, []);
      grouped.get(page)!.push(order);
    });
    for (const [pageNumber, orders] of grouped) {
      map.set(
        pageNumber,
        getMenuOrderSummary({ menus: watchedMenus ?? [], orders }),
      );
    }
    return map;
  }, [watchedOrders, watchedMenus]);

  const totalSummary = useMemo(() => {
    return getMenuOrderSummary({
      menus: watchedMenus ?? [],
      orders: watchedOrders ?? [],
    });
  }, [watchedMenus, watchedOrders]);

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

      sessionStorage.removeItem("geminiPreviewData");
      router.push("/");
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "เกิดข้อผิดพลาดในการเชื่อมต่อ";
      toast.error(errorMessage, {
        id: toastId,
      });
    }
  };

  if (isPageLoading) {
    return <Loading />;
  }

  return (
    <div>
      {isStreaming && (
        <div className="sticky top-0 z-10 bg-primary/5 border-b backdrop-blur-sm">
          <div className="flex items-center gap-2 px-4 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
            <span className="text-sm text-primary font-medium">
              กำลังประมวลผลหน้าถัดไป... (
              {Object.keys(streamOrdersByPage).length}/{totalPages} หน้า)
            </span>
          </div>
        </div>
      )}

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

        {allPageNumbers.map((pageNumber) => {
          const pageData = ordersByPage.find(([pn]) => pn === pageNumber);

          if (!pageData) {
            return (
              <PageLoadingSkeleton
                key={pageNumber}
                pageNumber={pageNumber}
              />
            );
          }

          const [, pageOrders] = pageData;
          const summary = pageSummaries.get(pageNumber) ?? [];

          return (
            <section
              key={pageNumber}
              className="space-y-4 px-2 mt-6 animate-in fade-in duration-500"
            >
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

        {orderFields.length > 0 && !isStreaming && ordersByPage.length > 1 && (
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

        {orderFields.length === 0 && !isStreaming && (
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
          <Button
            type="submit"
            disabled={formState.isSubmitting || isStreaming}
          >
            {formState.isSubmitting || isStreaming ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Save />
            )}
            {isStreaming ? "รอประมวลผล..." : "บันทึกข้อมูล"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PreviewPage;
