"use client";

import { CustomerFormValues } from "@/app/types/customer";
import { useCustomerModal } from "@/hooks/use-customer-modal";
import axios from "axios";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { mutate } from "swr";
import { Button } from "../ui/button";
import { DialogClose, DialogFooter } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import Modal from "../ui/modal";
import { Switch } from "../ui/switch";

export const CustomerModal = () => {
  const customerModal = useCustomerModal();
  const initialData = customerModal.data;
  const aliasesString = initialData?.aliases.join(", ");

  const [name, setName] = useState(initialData?.name || "");
  const [aliases, setAliases] = useState(aliasesString);
  const [disableAliases, setDisableAliases] = useState(
    initialData?.disableAliases || false,
  );
  const [isLoading, setIsLoading] = useState(false);

  const currentId = initialData?.id;

  useEffect(() => {
    setName(initialData?.name || "");
    setAliases(aliasesString || "");
    setDisableAliases(initialData?.disableAliases || false);
  }, [customerModal.data]);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      setIsLoading(true);
      if (initialData) {
        await axios.patch(`/api/customers/${currentId}`, data);
        toast.success("อัปเดตข้อมูลสำเร็จ");
      } else {
        await axios.post("/api/customers", data);
        toast.success("เพิ่มข้อมูลสำเร็จ");
        customerModal.setData(null);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาด อาจมีชื่อซ้ำอยู่แล้ว");
    } finally {
      setIsLoading(false);
      mutate("/api/customers");
      customerModal.onClose();
    }
  };

  return (
    <Modal
      title={`${initialData ? "แก้ไข" : "เพิ่ม"}ข้อมูลลูกค้า`}
      description="อัปเดตชื่อหลัก หรือเพิ่ม/ลบ Aliases
            (คั่นแต่ละคำด้วยเครื่องหมายจุลภาค ,)"
      isOpen={customerModal.isOpen}
      onClose={customerModal.onClose}
    >
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="edit-name">ชื่อลูกค้าหลัก</Label>
          <Input
            id="edit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-aliases">คำที่ AI มักอ่านผิด</Label>
          <Input
            id="edit-aliases"
            placeholder="เช่น Ton, โอค, P'เอียด"
            value={aliases}
            onChange={(e) => setAliases(e.target.value)}
            // onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
          />
        </div>
        <div className="flex gap-2">
          <Switch
            id={"edit-aliases"}
            checked={disableAliases}
            onCheckedChange={() => setDisableAliases(!disableAliases)}
          />
          <Label htmlFor="edit-aliases">
            ปิดใช้งานการบันทึกคำที่ AI มักอ่านผิดอัตโนมัติ
          </Label>
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">ยกเลิก</Button>
        </DialogClose>
        <Button
          onClick={() => {
            onSubmit({
              name,
              aliases:
                aliases !== ""
                  ? aliases?.split(",").map((item) => item.trim())
                  : [],
              disableAliases,
            });
          }}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              กำลังอัปเดตข้อมูล
            </>
          ) : (
            <>
              <Save />
              {initialData ? "อัปเดตข้อมูล" : "เพิ่มข้อมูล"}
            </>
          )}
        </Button>
      </DialogFooter>
    </Modal>
  );
};
