"use client";

import { ArrowLeft, ListOrdered, Loader2, Save, Utensils } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { format } from "date-fns";
import { Customer } from "@/app/types/customer";
import NameCombobox from "@/components/name-combobox";
import { Button } from "@/components/ui/button";
import { findBestCustomerMatch } from "@/lib/fuzzy-match";
import { toast } from "react-hot-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useDateStore } from "@/hooks/use-date";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PreviewPage() {
  const router = useRouter();
  const { date } = useDateStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [menus, setMenus] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const { data: response, isLoading: isDbLoading } = useSWR(
    "/api/customers",
    fetcher,
  );
  const customers: Customer[] = response?.data || [];

  const formattedDate = date
    ? format(date, "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    if (!isProcessing) return;
    if (isDbLoading) return;

    const savedData = sessionStorage.getItem("geminiPreviewData");
    if (!savedData) {
      router.push("/");
      return;
    }

    try {
      const rawResult = JSON.parse(savedData);
      const rawOrders = rawResult.data?.orders || rawResult.orders || [];
      const rawMenus = rawResult.data?.menus || rawResult.data?.menu || [];

      setMenus(rawMenus);

      const enriched = rawOrders.map((order: any) => {
        const aiName = order.customerName || "";
        const match = findBestCustomerMatch(aiName, customers);

        let statusColor = "yellow";
        let finalId = null;
        let inputName = aiName;

        if (match.suggestedCustomer) {
          finalId = match.suggestedCustomer.id;
          inputName = match.suggestedCustomer.name;
          statusColor = match.isExactMatch ? "green" : "yellow";
        }

        return {
          ...order,
          matchResult: match,
          statusColor,
          finalCustomerId: finalId,
          inputName,
        };
      });

      setOrders(enriched);
    } catch (error) {
      console.error("Error parsing session data:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [customers, isDbLoading, isProcessing, router]);

  const menuMap = useMemo(() => {
    const map = new Map<string, string>();
    menus.forEach((m) => {
      map.set(m.id.toString(), m.name);
    });
    return map;
  }, [menus]);

  const customerNamesList = useMemo(() => {
    return customers.map((c) => c.name);
  }, [customers]);

  const handleMenuChange = useCallback(
    (index: number, field: string, value: string | number) => {
      setMenus((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], [field]: value };
        return updated;
      });
    },
    [],
  );

  const handleNameChange = useCallback(
    (index: number, newName: string) => {
      setOrders((prevOrders) => {
        const updated = [...prevOrders];
        const safeName = (newName || "").trim();
        updated[index].inputName = safeName;

        if (!safeName) {
          updated[index].finalCustomerId = null;
          updated[index].statusColor = "red";
          return updated;
        }

        const matchedCustomer = customers.find(
          (c) =>
            c.name.toLowerCase() === safeName.toLowerCase() ||
            c.aliases.some((a) => a.toLowerCase() === safeName.toLowerCase()),
        );

        if (matchedCustomer) {
          updated[index].finalCustomerId = matchedCustomer.id;
          updated[index].statusColor = "green";
        } else {
          updated[index].finalCustomerId = null;
          updated[index].statusColor = "yellow";
        }

        return updated;
      });
    },
    [customers],
  );

  const handleNoteChange = useCallback((index: number, note: string) => {
    setOrders((prev) => {
      const updated = [...prev];
      updated[index].note = note;
      return updated;
    });
  }, []);

  const handleDeliveryChange = useCallback(
    (index: number, delivery: boolean) => {
      setOrders((prev) => {
        const updated = [...prev];
        updated[index].delivery = delivery;
        return updated;
      });
    },
    [],
  );

  const handleConfirmSave = async () => {
    const hasEmptyName = orders.some((o) => !o.inputName?.trim());

    if (hasEmptyName) {
      toast.error("กรุณาระบุชื่อลูกค้าให้ออเดอร์ครบทุกช่อง");
      return;
    }

    setIsSaving(true);
    const toastId = toast.loading("กำลังบันทึกข้อมูล...");

    try {
      const response = await fetch(`/api/save-orders?date=${formattedDate}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          menus: menus,
          orders: orders,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      toast.success("บันทึกข้อมูลเรียบร้อย!", {
        id: toastId,
      });

      sessionStorage.removeItem("geminiPreviewData");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ", {
        id: toastId,
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (isDbLoading || isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">
          กำลังเปรียบเทียบข้อมูลกับฐานข้อมูลลูกค้า...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">ตรวจสอบความถูกต้อง (Preview)</h1>
      </div>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
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
              {menus.map((menu, idx) => (
                <tr
                  key={idx}
                  className="border-b last:border-0 hover:bg-slate-50"
                >
                  <td className="p-4">
                    <Input
                      value={menu.name || ""}
                      onChange={(e) =>
                        handleMenuChange(idx, "name", e.target.value)
                      }
                      placeholder="เช่น ข้าวผัดหมู"
                      className="bg-white"
                    />
                  </td>
                  <td className="p-4">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">
                        ฿
                      </span>
                      <Input
                        type="number"
                        value={menu.price || ""}
                        onChange={(e) =>
                          handleMenuChange(
                            idx,
                            "price",
                            parseFloat(e.target.value),
                          )
                        }
                        className="pl-8 bg-white"
                        min={0}
                        placeholder="0.00"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <Input
                      type="number"
                      value={menu.amount || ""}
                      onChange={(e) =>
                        handleMenuChange(
                          idx,
                          "amount",
                          parseInt(e.target.value, 10),
                        )
                      }
                      className="bg-white"
                      min={0}
                      placeholder="0"
                    />
                  </td>
                </tr>
              ))}
              {menus.length === 0 && (
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
      <section className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <ListOrdered className="h-5 w-5 text-primary" />
          สรุปรายการสั่งอาหาร
        </h2>
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 w-[30%]">ชื่อลูกค้า</th>
                <th className="p-4 w-[40%]">รายการ</th>
                <th className="p-4 w-[30%]">เพิ่มเติม</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, idx) => (
                <tr
                  key={idx}
                  className={`border-b last:border-0 ${
                    order.statusColor === "red"
                      ? "bg-red-50/30"
                      : order.statusColor === "yellow"
                        ? "bg-yellow-50/30"
                        : ""
                  }`}
                >
                  <td className="p-4 align-top">
                    <NameCombobox
                      order={order}
                      customers={customers}
                      customerNamesList={customerNamesList}
                      onUpdate={(newName) => handleNameChange(idx, newName)}
                    />
                  </td>

                  <td className="p-4 align-top">
                    <ul className="list-disc list-inside space-y-1">
                      {order.orderItems?.map((item: any, i: number) => {
                        const menuName =
                          menuMap.get(item.menuId.toString()) ||
                          `เมนู ID: ${item.menuId}`;
                        return (
                          <li key={i}>
                            {menuName}{" "}
                            <span className="text-muted-foreground">
                              x {item.amount}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </td>

                  <td className="p-4 align-top">
                    <div className="flex flex-col space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`delivery-${idx}`}
                          checked={!!order.delivery}
                          onCheckedChange={(checked) =>
                            handleDeliveryChange(idx, !!checked)
                          }
                        />
                        <label
                          htmlFor={`delivery-${idx}`}
                          className="text-sm font-medium leading-none cursor-pointer"
                        >
                          ส่ง
                        </label>
                      </div>

                      <div>
                        <Textarea
                          placeholder="เพิ่มหมายเหตุ..."
                          value={order.note || ""}
                          onChange={(e) =>
                            handleNoteChange(idx, e.target.value)
                          }
                          className="resize-none h-[60px] text-sm"
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex justify-end gap-4 pt-4">
        <Button variant="ghost" onClick={() => router.back()}>
          กลับไปแก้รูป
        </Button>
        <Button
          onClick={handleConfirmSave}
          className="bg-primary px-8"
          disabled={isSaving}
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {isSaving ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
        </Button>
      </div>
    </div>
  );
}
